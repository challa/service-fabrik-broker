'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const logger = require('../../common/logger');
const errors = require('../../common/errors');
const utils = require('../../common/utils');
const catalog = require('../../common/models').catalog;
const Timeout = errors.Timeout;
const ContainerStartError = errors.ContainerStartError;
const ServiceInstanceAlreadyExists = errors.ServiceInstanceAlreadyExists;
const ServiceInstanceNotFound = errors.ServiceInstanceNotFound;
const CONST = require('../../common/constants');
const assert = require('assert');
const config = require('../../common/config');
const BaseService = require('../BaseService');
const BasePlatformManager = require('../../platform-managers/BasePlatformManager');

class DockerService extends BaseService {
  constructor(guid, plan) {
    super(plan);
    this.guid = guid;
    this.plan = plan;
    this.platformManager = undefined;
    this.prefix = CONST.SERVICE_FABRIK_PREFIX;
    this.imageInfo = undefined;
  }

  assignPlatformManager(platformManager) {
    this.platformManager = platformManager;
  }


  create(params) {
    const parameters = params.parameters;
    const options = {
      context: params.context
    };
    return this
      .buildContainerOptions(parameters, exposedPorts, options)
      .then(opts => this.createAndStartContainer(opts, true))
      .catchThrow(DockerError.Conflict, new ServiceInstanceAlreadyExists(this.guid))
      .then(() => this.ensureContainerIsRunning(true))
      .then(() => this.platformManager.postInstanceProvisionOperations({
        ipRuleOptions: this.buildIpRules(),
        guid: this.guid,
        context: params.context
      }));
  }

  update(params) {
    const parameters = params.parameters;
    let exposedPorts;
    const options = {};
    return this
      .inspectContainer()
      .tap(containerInfo => {
        exposedPorts = containerInfo.Config.ExposedPorts;
        options.portBindings = containerInfo.HostConfig.PortBindings;
        options.environment = this.getEnvironment();
      })
      .catchThrow(DockerError.NotFound, new ServiceInstanceNotFound(this.guid))
      .then(() => this.removeContainer())
      .then(() => this.buildContainerOptions(parameters, exposedPorts, options))
      .then(opts => this.createAndStartContainer(opts, false))
      .then(() => this.ensureContainerIsRunning(false));
  }

  delete(params) {
    /* jshint unused:false */
    return Promise.try(() => this
        .platformManager.preInstanceDeleteOperations({
          guid: this.guid
        })
      )
      .then(() => this.removeContainer())
      .catchThrow(DockerError.NotFound, new ServiceInstanceNotFound(this.guid))
      .then(() => this.removeVolumes());
  }

  bind(params) {
    /* jshint unused:false */
    return this
      .inspectContainer()
      .catchThrow(DockerError.NotFound, new ServiceInstanceNotFound(this.guid))
      .then(() => this.createCredentials());
  }

  unbind(params) {
    /* jshint unused:false */
  }
  
  module.exports = TpsK8SService;
