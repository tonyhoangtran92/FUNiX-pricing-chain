pragma solidity ^0.5.0;

// Interface of Main contract to call from Session contract
// contract Main {
//     function addSession(address session) public {}
// }

import "./Main.sol";
import "./SafeMath.sol";

contract Session {

    using SafeMath for uint256;
    // Variable to hold Main Contract Address when create new Session Contract
    address public mainContract;
    // Variable to hold Main Contract instance to call functions from Main
    Main MainContract;

    // TODO: Variables
    address public creator;
    enum State{CREATED, ONGOING, CLOSED, FINISHED, STOPPED}
    State public state;
    State public stateBefore;
    uint public timeStop;
    uint public timeOut;
    string public name;
    string public description;
    string public image;
    address [] public iParticipants;
    mapping (address => uint) public pricings;
    uint public proposedPrice;
    uint public nParticipants;
    
    constructor(address _mainContract, string memory _name, string memory _description, string memory _image) public {
        // Get Main Contract instance
        mainContract = _mainContract;
        MainContract = Main(_mainContract);
        
        // TODO: Init Session contract
        creator = MainContract.admin();
        state = State.CREATED;
        name = _name;
        description = _description;
        image = _image;
        // Call Main Contract function to link current contract.
        MainContract.addSession(address(this));
    }

    // TODO: Functions
    //modifier validstate
    modifier validState(State _state) {
        require(state==_state, "State is not valid");
        _;
    }

    //modifier only admin
    modifier onlyAdmin() {
        require(msg.sender == creator, "Only admin");
        _;
    }

    //modifier to check participants register or not
    modifier validRegister() {
        require(msg.sender == MainContract.getAccountOfParticipant(msg.sender), "Only valid register");
        _;
    }

    //function for admin start Session
    function startSession(uint _timeOut) public onlyAdmin {
        require(state ==State.CREATED || state == State.STOPPED, "Cannot start session");
        if(state == State.CREATED) {
            if(_timeOut == 0) {
                timeOut = 0;
            } else {
                timeOut = _timeOut.add (now);
            }
            state = State.ONGOING;
        } else {
            state = stateBefore;
            if(timeOut > timeStop) {
                timeOut = timeOut.add(now).sub(timeStop);
            }
        }
    }

    function closeSession() public onlyAdmin validState(State.ONGOING) {
        state = State.CLOSED;
    }

    //stop function to halt session a moment
    function stopSession() public onlyAdmin {
        require(state == State.CREATED || state == State.ONGOING || state == State.CLOSED, "Cannot stop sessions");
        stateBefore = state;
        state = State.STOPPED;
        timeStop = now;
    }

    //function for participant price the product
    function priceProduct(uint _amount) public validState(State.ONGOING) validRegister{
        if(timeOut > 0 && now>= timeOut) {
            state = State.CLOSED;
        } else {
            if(pricings[msg.sender] > 0) {
                pricings[msg.sender] = _amount;
            } else {
                pricings[msg.sender] = _amount;
                nParticipants = iParticipants.push(msg.sender);
                MainContract.increNumSessionOfParticipant(msg.sender);
            }
        }
    }

    //function to calculate proposed price and final price
    function calculateFinalPrice() public onlyAdmin validState(State.CLOSED) {
        uint totalDeviation = 0;
        //calucate total Deviation of all participant in a Session
        for(uint i=0; i<nParticipants; i++) {
            address tempPar = iParticipants[i];
            totalDeviation = totalDeviation.add(MainContract.getDeviation(tempPar));
        }

        //calculate proposedPrice
        for(uint j = 0; j<nParticipants; j++) {
            address _address = iParticipants[j];
            proposedPrice = proposedPrice.add(pricings[_address].mul((10000-MainContract.getDeviation(_address))));
        }
        proposedPrice = proposedPrice.mul(100).div(nParticipants.mul(10000).sub(totalDeviation));

        //update Deviation for each participant
        for(uint k = 0; k<nParticipants; k++) {
            uint deviationNew = 0;
            address p = iParticipants[k];
            if(proposedPrice >= pricings[p].mul(100)){
                deviationNew = (proposedPrice - 100*pricings[p])*100;
            } else {
                deviationNew = (100*pricings[p] - proposedPrice)*100;
            }
            uint genDevi = (MainContract.getDeviation(p)*nParticipants*proposedPrice + 100*deviationNew);
            genDevi = genDevi.div(((nParticipants.add(1)).mul(proposedPrice)));
            MainContract.setDeviation(p,genDevi);
        }
        state = State.FINISHED;
    }

    function updateProduct(string memory _name, string memory _description) public onlyAdmin {
        name = _name;
        description = _description;
    }

}



