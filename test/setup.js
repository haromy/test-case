const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');

// Configure chai
chai.use(sinonChai);
chai.use(chaiAsPromised);

// Global test setup
before(() => {
  // Add any global setup here
});

// Global test teardown
after(() => {
  // Add any global cleanup here
});

// Reset sinon after each test
afterEach(() => {
  sinon.restore();
}); 