pragma solidity ^0.5.0;
import "./SafeMath.sol";

contract Main {

    using SafeMath for uint256;

    // Structure to hold details of Bidder
    struct IParticipant {
        // TODO
        address account;
        string fullname;
        string email;
        uint nSessions;
        uint deviation;
    }

    address public admin;

    // TODO: Variables
    //nSessions contain number of session init
    uint public nSessions;
    //nParticipant contain number of participant
    uint public nParticipants;
    address[] public iParticipants;
    //array contain address of session contract
    address[] public sessions;
    //mapping address of participant to struct participant
    mapping(address => IParticipant) public participants;

    constructor () public {
        admin = msg.sender;
    }


    // Add a Session Contract address into Main Contract. Use to link Session with Main
    function addSession(address session) public {
        // TODO
        nSessions = sessions.push(session);
    }

    // TODO: Functions

    //function register to allow participant register to system pricing
    function register(string memory _fullname, string memory _email) public returns (string memory, string memory) {
        if(participants[msg.sender].account == address(0)) {
            participants[msg.sender].account = msg.sender;
            participants[msg.sender].fullname = _fullname;
            participants[msg.sender].email = _email;
            participants[msg.sender].nSessions = 0;
            participants[msg.sender].deviation = 0;
            nParticipants = iParticipants.push(msg.sender);
        }

        return (_fullname, _email);
    }

    //function to increment number of session that participant joined
    function increNumSessionOfParticipant(address _address) public {
        participants[_address].nSessions = participants[_address].nSessions.add(1);
    }

    //function to get deviation of participant
    function getDeviation(address _address) public view returns (uint) {
        return participants[_address].deviation;
    }

    //function to update deviation of participant
    function setDeviation(address _address, uint _devi) public {
        participants[_address].deviation = _devi;
    }

    function getAccountOfParticipant(address _address) public view returns (address) {
        return participants[_address].account;
    }

    function updateParticipantInfo(string memory _fullname, string memory _email, address _account) public {
        require(msg.sender == _account, "Cannot update");
        participants[msg.sender].fullname = _fullname;
        participants[msg.sender].email = _email;
    }
}
