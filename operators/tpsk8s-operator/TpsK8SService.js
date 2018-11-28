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
const Client = require('kubernetes-client').Client;
const k8sconfig = require('kubernetes-client').config;

const sampleDeployment = require('./deployment.json');
const crdJson = require('./crd.json');
const serviceJson = require('./service.json');

const client = new Client({ config: k8sconfig.fromKubeconfig(), version: '1.9' })
client.loadSpec()

class TpsK8SService extends BaseService {
  constructor(guid, plan) {
    super(plan);
    this.guid = guid;
    this.plan = plan;
    this.platformManager = undefined;
    this.prefix = CONST.SERVICE_FABRIK_PREFIX;
    this.servicePrefix = CONST.SERVICE_FABRIK_PREFIX+"-service";
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
    tpsK8SService.assignPlatformManager(TpsK8SService.getPlatformManager(tpsK8SService.platformContext))
    return tpsK8SService;
  }

  get platformContext() {
          const context = {
            platform: CONST.PLATFORM.CF
          };
          return context;
  }

  static getPlatformManager(context) {
    let platform = context.platform;
    if (platform === CONST.PLATFORM.SM) {
      platform = context.origin;
    }
    const PlatformManager = (platform && CONST.PLATFORM_MANAGER[platform]) ? require(`../../platform-managers/${CONST.PLATFORM_MANAGER[platform]}`) : ((platform && CONST.PLATFORM_MANAGER[CONST.PLATFORM_ALIAS_MAPPINGS[platform]]) ? require(`../../platform-managers/${CONST.PLATFORM_MANAGER[CONST.PLATFORM_ALIAS_MAPPINGS[platform]]}`) : undefined);
    if (PlatformManager === undefined) {
      return new BasePlatformManager(platform);
    } else {
      return new PlatformManager(platform);
    }
  }

  create(params) {

    var deploymentName = `${this.prefix}-${this.guid}`
    var serviceName =`${this.servicePrefix}-${this.guid}`

    
    sampleDeployment.metadata.name = deploymentName

    serviceJson.metadata.name = serviceName
    serviceJson.spec.selector.couchdb_cr = deploymentName
  
    Promise.try(()=> client.addCustomResourceDefinition(crdJson))
     .then(() => client.apis['cache.example.com'].v1alpha1.namespaces('default').couchdbs.post({ body: sampleDeployment }))
     .then(() => client.apis['cache.example.com'].v1alpha1.namespaces('default').couchdbs.get())
     .then(couchdbs => console.log(couchdbs.body.items))
     .then(()=>client.api.v1.namespaces('default').services.post({body: serviceJson}))
     
  }

  delete(params) {

    var deploymentName = `${this.prefix}-${this.guid}`
    var serviceName =`${this.servicePrefix}-${this.guid}`

    serviceJson.spec.selector.couchdb_cr = deploymentName
    sampleDeployment.metadata.name = deploymentName
    serviceJson.metadata.name = serviceName

    Promise.try(()=> client.addCustomResourceDefinition(crdJson))
      .then(()=>client.api.v1.namespaces('default').service(serviceName).delete())
      .then(()=> client.apis['cache.example.com'].v1alpha1.namespaces('default').couchdbs(deploymentName).delete())
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

  // delete(params) {
  //   nrc.run('kubectl -n my-namespace delete mysqlclusters my-app-db2')
  //   return "81f0bc30-1d0a-4d21-b99c-d885bd4c2ccf"
  // }

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
