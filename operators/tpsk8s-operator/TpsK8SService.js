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
const nrc = require('node-run-cmd');
const kc = require('kubernetes-client');
const config = require('../../common/config');
const Client = require('kubernetes-client').Client;
const config = require('kubernetes-client').config;
sampleDeployment = require('./cache_v1alpha_couchdb_cr.json');
const crdJson =  require('./crd.json');




class TpsK8SService extends BaseService {
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


  static createInstance(instanceId, options) {
    const planId = options.plan_id;
    const plan = catalog.getPlan(planId);
    const context = _.get(options, 'context');
    const tpsK8SService = new TpsK8SService(instanceId, plan);
    return tpsK8SService;
  }

  create(params) {
    containerName = getContainerName();
    sampleDeployment.metadata.name=containerName;
    client.addCustomResourceDefinition(crdJson); 
    client.loadSpec()
      .then(()=> client.apis['cache.example.com'].v1alpha1.namespaces('default').couchdbs.post({ body: sampleDeployment }))



  

   }


   getContainerName() {
    return `${this.prefix}-${this.guid}`;
  }



  // create(params) {

  //   nrc.run('kubectl apply -f  https://raw.githubusercontent.com/challa/k8sdeployments/master/mysql.yaml');

  //   const parameters = params.parameters;
  //   const options = {
  //     context: params.context
  //   };

  //   return "81f0bc30-1d0a-4d21-b99c-d885bd4c2ccf"
  // }

  update(params) {
    const parameters = params.parameters;
    let exposedPorts;
    const options = {};
  }

  delete(params) {

    nrc.run('kubectl -n my-namespace delete mysqlclusters my-app-db2')
    return "81f0bc30-1d0a-4d21-b99c-d885bd4c2ccf"
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
}
  
module.exports = TpsK8SService;
