'use strict';

const TpsK8SOperator = require('./tpsk8s-operator/TpsK8SOperator');
const TpsK8SBindOperator = require('.tpsk8s-operator/TpsK8SBindOperator');

const tpsK8sOperator = new TpsK8SOperator();
const tpsK8sBindOperator = new TpsK8SBindOperator();
tpsK8sOperator.init();
tpsK8sBindOperator.init();
