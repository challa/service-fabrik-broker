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

const sampleDeployment = require('./deployment.json');
const crdJson = require('./crd.json');
const serviceJson = require('./service.json');

const Client = require('kubernetes-client').Client
const config = require('kubernetes-client').config
const client = new Client({ config: config.fromKubeconfig(), version: '1.9' })
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
    return tpsK8SService;
  }

  create(params) {

    deploymentName = `${this.prefix}-${this.guid}`
    serviceName =`${this.servicePrefix}-${this.guid}`

    serviceJson.spec.selector.couchdb_cr = deploymentName
    sampleDeployment.metadata.name = serviceName
    serviceJson.metadata.name = deploymentName
  
    client.addCustomResourceDefinition(crdJson)
     .then(() => client.apis['cache.example.com'].v1alpha1.namespaces('default').couchdbs.post({ body: sampleDeployment }))
     .then(() => client.apis['cache.example.com'].v1alpha1.namespaces('default').couchdbs.get())
     .then(couchdbs => console.log(couchdbs.body.items))
     .then(()=>client.api.v1.namespaces('default').services.post({body: serviceJson}))
     
  }

  delete(params) {

    deploymentName = `${this.prefix}-${this.guid}`
    serviceName =`${this.servicePrefix}-${this.guid}`

    serviceJson.spec.selector.couchdb_cr = deploymentName
    sampleDeployment.metadata.name = serviceName
    serviceJson.metadata.name = deploymentName

    client.addCustomResourceDefinition(crdJson)
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
