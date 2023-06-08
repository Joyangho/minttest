/*
연결할 블록체인의 네트워크를 지정해주어야 합니다.

대표적인 네트워크는 아래와 같습니다.
Ethereum = 1
Ropsten 테스트 네트워크 = 3
Rinkeby 테스트 네트워크 = 4
Goerli 테스트 네트워크 = 5

Polygon Mainnet = 137;
Polygon Mumbai testnet = 80001;

저는 Mumbai testnet 기준으로 테스트하여 80001 로 설정하였으나
편하신 네트워크로 설정하시면 됩니다.
*/
const Network = 5;


/*
Web page가 실행되면서 실행할 함수를 아래와 같이 설정합니다.
현재는 NFT 의 Mint count를 보여주는 함수만 실행하도록 넣어놨습니다.
*/

(async () => {
    setMintCount();
})();

/*
지갑의 상태를 저장할 전역변수입니다.
Javascrip 함수 전반에서 사용하므로 전역변수로 선언하였습니다.
*/

var WalletAddress = "";
var WalletBalance = "";

/*
지갑을 연결하는 함수입니다.
기본적으로 이더리움 네트워크에 연결할 수 있는지 확인하며
네트워크 연결여부를 확인합니다.
정확한 네트워크에 연결되어있지 않다면 alert 를 호출합니다.
*/
async function connectWallet(){
    if(window.ethereum){
        await window.ethereum.send('eth_requestAccounts');
        window.web3 = new Web3(window.ethereum);
        //Check network
        if(window.web3._provider.networkVersion != Network){
          alert("Please connect correct network","","warning");
        }
        
        //Get Account information
        var accounts = await web3.eth.getAccounts();
        WalletAddress = accounts[0];
        WalletBalance = await web3.eth.getBalance(WalletAddress);

        //기본적으로 모든 Balance 정보들은 wei 단위로 오게됩니다. 이를 ether 단위로 변경하려면 아래 util을 사용하거나 10의18승을 곱해주어야 합니다.
        //아래는 민팅에 필요한 최소비용보다 보유한 ether가 적을경우 지갑이 연결되지 않도록 하는 함수입니다.
        if(web3.utils.fromWei(WalletBalance) < 0.054){
            alert("You need more Ethereum");
        }else{
            document.getElementById("txtWalletAddress").innerHTML = WalletAddress;
            document.getElementById("txtWalletBalance").innerHTML = web3.utils.fromWei(WalletBalance);
            document.getElementById("walletInfo").style.display = "block";
            document.getElementById("btnConnectWallet").style.display = "none";
        }
    }
}

/*
현재 Smart contract의 Mint count 정보를 얻어오는 함수입니다.
여기서 중요한 부분은
contract = new web3.eth.Contract(ABI, ADDRESS);
부분이며
들어가는 ABI와 ADDRESS는
smartcontract.js 파일에 별도 정의하였습니다.
contract라는 객체를 생성하여, 모든 Smart contract와의 상호작용은 객체를 통해 이루어집니다.
*/
async function setMintCount(){
    await window.ethereum.send('eth_requestAccounts');
    window.web3 = new Web3(window.ethereum);
    contract = new web3.eth.Contract(ABI, ADDRESS);
    
    if(contract){
        //Smart contract의 totalSupply변수값을 가져오는 함수는 call()입니다.
        //Smart contract에서 public으로 선언된 변수는 모두 call로 가져올 수 있습니다.
        var totalSupply = await contract.methods.totalSupply().call();
        document.getElementById("txtTotalSupply").innerHTML = totalSupply;
        var totalSupply = await contract.methods.maxSupply().call();
        document.getElementById("txtMaxSupply").innerHTML = totalSupply;
    }
}

/*
Smart contract와는 전혀 관계가 없으며
단순하게 HTML을 컨트롤하기 위한 함수입니다.
작동원리는 간단합니다.
parameter로 "minus" 혹은 "plus"가 입력되며
해당 parameter의 값에 따라 mintAmount를 변경해주게 됩니다.
*/
function btnMintAmount(type){
    var amount = document.getElementById("txtMintAmount").innerHTML * 1;
    console.log(amount);
    switch(type){
        case "minus":
            if(amount > 1){
                amount -= 1;
                document.getElementById("txtMintAmount").innerHTML = amount;
            }
            break;
        case "plus":
            if(amount < 10){
                amount += 1;
                document.getElementById("txtMintAmount").innerHTML = amount;
            }
            break;
    }
}

/*
Smart contract의 function Publicmint(uint256 _mintAmount) 함수를 호출하는 부분입니다.
*/
async function mint(){
    await window.ethereum.send('eth_requestAccounts');
    window.web3 = new Web3(window.ethereum);
    contract = new web3.eth.Contract(ABI, ADDRESS);
    
    if(contract){
        var mintAmount = document.getElementById("txtMintAmount").innerHTML;
        /*
        Smart contract의 함수를 실행하기 위해서는 send라는 callback함수를 사용합니다.
        send는 반두시 from 이라는 parameter 가 들어가야하며
        Publicmint의 경우 payable이므로 value가 꼭 들어가야 합니다.
        이때 value 역시 wei 단위로 전달해야 하므로 가격에 10의18승을 곱해서 전달해야합니다.
        */
        var transaction = await contract.methods.Publicmint(mintAmount).send(
            { from : WalletAddress,
              value : 0.054 * mintAmount * 10 ** 18
            }).on('error',function(error){
                alert("Mint error!");
                console.log("Mint - Error : " + error);
            }).then(function(receipt){
                alert("Mint Success!");
                console.log("Mint - success : " + receipt);
          });
        console.log("Mint - transaction : " + transaction);
    }   
}