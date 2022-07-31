const Session = artifacts.require('./Session.sol');
const Main = artifacts.require('./Main.sol');
let SessionInstance;
let MainInstance;
let stateBeforeStop;

//let startBeforeStart;
contract('Contract test case', async accounts => {

    it('Test Main contract deployment', async () => {
        MainInstance = await Main.deployed();
        assert.notEqual(MainInstance, undefined, 'Failed to deploy main contract');
    });

    it('Test Session contract deployment', async () => {
        module.exports = function (deployer) {
            return deployer.deploy(Session, MainInstance.address, 'COMPUTER1', 'COMPUTER1', 'https://ipfs.io/ipfs/QmewTNKfCk7yjrVPsWoCpmidKn5x7JV7Lmv6K68BDtqQuP');
        };
        SessionInstance = await Session.new(MainInstance.address, 'COMPUTER1', 'COMPUTER1', 'https://ipfs.io/ipfs/QmewTNKfCk7yjrVPsWoCpmidKn5x7JV7Lmv6K68BDtqQuP');
        assert.notEqual(SessionInstance, undefined, 'Failed tp deploy session');
    });

    it('Test addSession Function', async () => {
        assert.equal(SessionInstance.address, await MainInstance.sessions(0), 'Failed to add address of Session to Main');
    });

    it('Test case register', async () => {
        await MainInstance.register('Tony1', 'tony1@funix.edu.vn', { from: accounts[1] });
        let participant1 = await MainInstance.participants(accounts[1]);
        assert.equal(accounts[1], participant1[0], "Failed to register accounts[1]");
        await MainInstance.register("Tony2", "tony2@funix.edu.vn", { from: accounts[2] });
        let participant2 = await MainInstance.participants(accounts[2]);
        assert.equal(accounts[2], participant2[0], "Failed to register accounts[2]");
    })

    it('Test case get deviation of participant', async () => {
        await MainInstance.register("Tony3", "tony3@funix.edu.vn", { from: accounts[3] });
        let deviationOfAccount3 = await MainInstance.getDeviation(accounts[3]);
        assert.equal(deviationOfAccount3, 0, "Failted to get deviation");
    });

    it('Test case get account of participant', async () => {
        let par3 = await MainInstance.participants(accounts[3]);
        assert.equal(par3[0], accounts[3], "Failed to get account of participants");
    });

    it('Successful start session in state CREATED', async () => {
        let startBeforeStart = await SessionInstance.state();
        await SessionInstance.startSession(600, { from: accounts[0] });
        let result = await SessionInstance.state();
        assert.equal(result, 1, "Failed to start session");
        assert.equal(startBeforeStart, 0, "Not valid state");
        assert(await SessionInstance.timeOut() > 600, "Set timeout fail");
    });

    it('Can not start session in state ONGOING', async () => {
        assert.equal(await SessionInstance.state(), 1, 'Invalid state ONGIING');
        try {
            await SessionInstance.startSession(600, { from: accounts[0] });
            assert(false);
        } catch (e) {
            assert(true);
        }
    });

    it('Only admin can start session', async () => {
        try {
            await SessionInstance.startSession(600, { from: accounts[1] });
            assert(false);
        } catch (e) {
            assert(true);
        }
    });

    it('Test case priceProduct function', async () => {
        assert.equal(await SessionInstance.state(), 1, 'Session not ONGOING');
        await SessionInstance.priceProduct(60, { from: accounts[1] });
        await SessionInstance.priceProduct(80, { from: accounts[2] });
        assert.equal(await SessionInstance.pricings(accounts[1]), 60, 'Failed to pricing from accounts[1]');
        assert.equal(await SessionInstance.pricings(accounts[2]), 80, 'Failed to pricing from accounts[2]');
        let par1 = await MainInstance.participants(accounts[1]);
        let par2 = await MainInstance.participants(accounts[2]);
        assert.equal(par1[3], 1, 'Failed to pricing from accounts[1]');
        assert.equal(par2[3], 1, 'Failed to pricing from accounts[2]');
    });

    it('Only registered participant can price', async () => {
        assert.equal(await MainInstance.getAccountOfParticipant(accounts[4]), '0x0000000000000000000000000000000000000000', 'Account already registered');
        try {
            await SessionInstance.priceProduct(60, { from: accounts[4] });
            assert(false);
        } catch (e) {
            assert(true);
        }
    });

    it('Test case stop session function', async () => {
        stateBeforeStop = await SessionInstance.state();
        await SessionInstance.stopSession({ from: accounts[0] });
        assert.equal(await SessionInstance.state(), 4, 'Failed to stop session action');
    });

    it('Successful start session in state STOPPED', async () => {
        await SessionInstance.startSession(0, { from: accounts[0] });
        assert.notEqual(await SessionInstance.state(), stateBeforeStop, 'Failed to start session action');
    });

    it('Only admin can close session', async () => {
        try {
            await SessionInstance.closeSession({ from: accounts[1] });
            assert(false);
        } catch (e) {
            assert(true);
        }
    });

    it('Cannot start session in state CLOSED', async () => {
        await SessionInstance.closeSession({ from: accounts[0] });
        assert.equal(await SessionInstance.state(), 2, 'Invalid state CLOSED');
        try {
            await SessionInstance.startSession(1000, { from: accounts[0] });
            assert(false);
        } catch (e) {
            assert(true);
        }
    });

    it('Test case calculateFinalPrice function', async () => {
        assert.equal(Number(await SessionInstance.proposedPrice()), 0, 'Failed to get final price');
        await SessionInstance.calculateFinalPrice({ from: accounts[0] });
        let proposedPrice = Number(await SessionInstance.proposedPrice());
        assert.equal(proposedPrice, 70, "Failed to calculate final price");
        assert.equal(await SessionInstance.state(), 3, 'Failed to calculate final price');
    });

    it('Test case set deviation of participant', async () => {
        assert.notEqual(await MainInstance.getDeviation(accounts[1]), 0, 'Failed to set deviation');
    });

    it('Can not set final price with different state CLOSED', async () => {
        assert.notEqual(await SessionInstance.state(), 2, 'Valid state FINISHED');
        try {
            await SessionInstance.calculateFinalPrice({ from: accounts[0] });
            assert(false);
        } catch (e) {
            assert(true);
        }
    });

    it('Only admin can set final price', async () => {
        try {
            await SessionInstance.calculateFinalPrice({ from: accounts[1] });
        } catch (e) {
            assert(true);
        }
    });

    it('Can not start session in state FINISHED', async () => {
        assert.equal(await SessionInstance.state(), 3, 'Invalid state FINISHED');
        try {
            await SessionInstance.startSession(600, { from: accounts[0] });
            assert(false);
        } catch (e) {
            assert(true);
        }
    });

    it('Close session when expire timeout', async () => {
        let _session = await Session.new(MainInstance.address, 'COMPUTER1', 'COMPUTER1', 'https://ipfs.io/ipfs/QmewTNKfCk7yjrVPsWoCpmidKn5x7JV7Lmv6K68BDtqQuP');
        await _session.startSession(2, { from: accounts[0] });
        await _session.priceProduct(80, { from: accounts[1] });
        function timeout(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }


        await timeout(2000);
        await _session.priceProduct(180, { from: accounts[1] });
        assert.equal(await _session.state(), 2, 'failed to test time out');
        assert.equal(80, await _session.pricings(accounts[1]), 'Failed to test time out');
    });

    it('Update product information', async () => {
        await SessionInstance.updateProduct('Blockchain course', 'This is blockchain course', { from: accounts[0] });
        assert.equal(await SessionInstance.name(), 'Blockchain course', 'Failed to update product');
    });

    it('Only admin can update product information', async () => {
        try {
            await SessionInstance.updateProduct('Blockchain course', 'This is blockchain course', { from: accounts[1] });
            assert(false);
        } catch (e) {
            assert(true);
        }
    });

    it('Update participant information', async () => {
        let par = await MainInstance.participants(accounts[1]);
        let name = par[1] + "test";
        await MainInstance.updateParticipantInfo(name, 'test', accounts[1], { from: accounts[1] });
        par = await MainInstance.participants(accounts[1]);
        assert.equal(name, par[1], 'Failed to update participant info');
    });

    it('Participant can not update other info', async () => {
        try {
            await MainInstance.updateParticipantInfo('test', 'test', accounts[1], { from: accounts[2] });
            assert(false);
        } catch (e) {
            assert(true);
        }
    })
})