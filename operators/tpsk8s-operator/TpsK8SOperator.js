'use strict';

const assert = require('assert');
const Promise = require('bluebird');
const eventmesh = require('../../data-access-layer/eventmesh');
const logger = require('../../common/logger');
const CONST = require('../../common/constants');
const utils = require('../../common/utils');
const BaseOperator = require('../BaseOperator');
const TpsK8SService = require('./TpsK8SService');
const errors = require('../../common/errors');
const ServiceInstanceNotFound = errors.ServiceInstanceNotFound;

class TpsK8SOperator extends BaseOperator {

  init() {
    const validStateList = [CONST.APISERVER.RESOURCE_STATE.IN_QUEUE, CONST.APISERVER.RESOURCE_STATE.UPDATE, CONST.APISERVER.RESOURCE_STATE.DELETE];
    return this.registerCrds(CONST.APISERVER.RESOURCE_GROUPS.DEPLOYMENT, CONST.APISERVER.RESOURCE_TYPES.TPSK8S)
      .then(() => this.registerWatcher(CONST.APISERVER.RESOURCE_GROUPS.DEPLOYMENT, CONST.APISERVER.RESOURCE_TYPES.TPSK8S, validStateList));
  }

  processRequest(changeObjectBody) {

    return Promise.try(() => {
        switch (changeObjectBody.status.state) {
        case CONST.APISERVER.RESOURCE_STATE.IN_QUEUE:
          return this._processCreate(changeObjectBody);
        case CONST.APISERVER.RESOURCE_STATE.UPDATE:
          return this._processUpdate(changeObjectBody);
        case CONST.APISERVER.RESOURCE_STATE.DELETE:
          return this._processDelete(changeObjectBody);
        default:
          logger.error('Ideally it should never come to default state! There must be some error as the state is ', changeObjectBody.status.state);
          break;
        }
      })
      .catch(err => {
        logger.error('Error occurred in processing request by TpsK8SOperator', err);
        return eventmesh.apiServerClient.updateResource({
          resourceGroup: CONST.APISERVER.RESOURCE_GROUPS.DEPLOYMENT,
          resourceType: CONST.APISERVER.RESOURCE_TYPES.TPSK8S,
          resourceId: changeObjectBody.metadata.name,
          status: {
            state: CONST.APISERVER.RESOURCE_STATE.FAILED,
            error: utils.buildErrorJson(err)
          }
        });
      });
  }

  _processCreate(changeObjectBody) {
    assert.ok(changeObjectBody.metadata.name, `Argument 'metadata.name' is required to process the request`);
    assert.ok(changeObjectBody.spec.options, `Argument 'spec.options' is required to process the request`);
    const changedOptions = JSON.parse(changeObjectBody.spec.options);
    assert.ok(changedOptions.plan_id, `Argument 'spec.options' should have an argument plan_id to process the request`);
    logger.info('Creating TPSK8S resource with the following options:', changedOptions);
    return TpsK8SService.createInstance(changeObjectBody.metadata.name, changedOptions)
      .then(tpsK8SService => tpsK8SService.create(changedOptions))
      .then(response => eventmesh.apiServerClient.updateResource({
        resourceGroup: CONST.APISERVER.RESOURCE_GROUPS.DEPLOYMENT,
        resourceType: CONST.APISERVER.RESOURCE_TYPES.TPSK8S,
        resourceId: changeObjectBody.metadata.name,
        status: {
          response: response,
          state: CONST.APISERVER.RESOURCE_STATE.SUCCEEDED
        }
      }));
  }

  _processUpdate(changeObjectBody) {
    assert.ok(changeObjectBody.metadata.name, `Argument 'metadata.name' is required to process the request`);
    assert.ok(changeObjectBody.spec.options, `Argument 'spec.options' is required to process the request`);
    const changedOptions = JSON.parse(changeObjectBody.spec.options);
    assert.ok(changedOptions.plan_id, `Argument 'spec.options' should have an argument plan_id to process the request`);
    logger.info('Updating TpsK8S resource with the following options:', changedOptions);
    return TpsK8SService.createInstance(changeObjectBody.metadata.name, changedOptions)
      .then(tpsK8SService => tpsK8SService.update(changedOptions))
      .then(response => eventmesh.apiServerClient.updateResource({
        resourceGroup: CONST.APISERVER.RESOURCE_GROUPS.DEPLOYMENT,
        resourceType: CONST.APISERVER.RESOURCE_TYPES.TPSK8S,
        resourceId: changeObjectBody.metadata.name,
        status: {
          response: response,
          state: CONST.APISERVER.RESOURCE_STATE.SUCCEEDED
        }
      }));
  }

  _processDelete(changeObjectBody) {
    assert.ok(changeObjectBody.metadata.name, `Argument 'metadata.name' is required to process the request`);
    assert.ok(changeObjectBody.spec.options, `Argument 'spec.options' is required to process the request`);
    const changedOptions = JSON.parse(changeObjectBody.spec.options);
    assert.ok(changedOptions.plan_id, `Argument 'spec.options' should have an argument plan_id to process the request`);
    logger.info('Deleting TpsK8S resource with the following options:', changedOptions);
    return TpsK8SService.createInstance(changeObjectBody.metadata.name, changedOptions)
      .then(tpsK8SService => tpsK8SService.delete(changedOptions))
      .then(() => eventmesh.apiServerClient.deleteResource({
        resourceGroup: CONST.APISERVER.RESOURCE_GROUPS.DEPLOYMENT,
        resourceType: CONST.APISERVER.RESOURCE_TYPES.TPSK8S,
        resourceId: changeObjectBody.metadata.name
      }))
      .catch(ServiceInstanceNotFound, () => eventmesh.apiServerClient.deleteResource({
        resourceGroup: CONST.APISERVER.RESOURCE_GROUPS.DEPLOYMENT,
        resourceType: CONST.APISERVER.RESOURCE_TYPES.TPSK8S,
        resourceId: changeObjectBody.metadata.name
      }));
  }
}

module.exports = TpsK8SOperator;

