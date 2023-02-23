import React,{useEffect, useState }  from 'react';
import './App.css';
import idl from './idl.json';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import kp from './keypair.json'
import { Buffer } from 'buffer';
window.Buffer = Buffer;
import { RiDeleteBin6Line } from 'react-icons/ri';

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TEST_GIFS = [
	'https://i.giphy.com/media/eIG0HfouRQJQr1wBzz/giphy.webp',
	'https://media3.giphy.com/media/L71a8LW2UrKwPaWNYM/giphy.gif?cid=ecf05e47rr9qizx2msjucl1xyvuu47d7kf25tqt2lvo024uo&rid=giphy.gif&ct=g',
	'https://media4.giphy.com/media/AeFmQjHMtEySooOc8K/giphy.gif?cid=ecf05e47qdzhdma2y3ugn32lkgi972z9mpfzocjj6z1ro4ec&rid=giphy.gif&ct=g',
	'https://i.giphy.com/media/PAqjdPkJLDsmBRSYUp/giphy.webp'
]

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList]= useState([]);

  const onInputChange = (event) => {
  const { value } = event.target;
  setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network,opts.preflightCommitment);
    const provider = new Provider(connection, window.solana, opts.preflightCommitment,
  );
	  return provider;
  }
  
  const createGifAccount = async () => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    console.log("ping")
    await program.rpc.startStuffOff({
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [baseAccount]
    });
    console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
    await getGifList();

  } catch(error) {
    console.log("Error creating BaseAccount account:", error)
  }
}
  
  
  const checkIfWalletIsConnected = async () => {
    try {
      const {solana}=window;

      if(solana){
        if(solana.isPhantom) { console.log('Phantom wallet found!');}
        const response = await solana.connect({onlyIfTrusted:true});
        console.log(
          'Connected with Public Key:',
          response.publicKey.toString()
        );
        setWalletAddress(response.publicKey.toString());
        }else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async()=>{
    const {solana} = window;
     if(solana) {
       const response = await solana.connect();
       console.log('Connected with Public Key:',response.publicKey.toString());
       setWalletAddress(response.publicKey.toString());
     }
  };

  const renderNotConnectedContainer = () =>(
<button
  className="cta-button connect-wallet-button"
  onClick={connectWallet}>
  Connect to Wallet
</button>  
);
  
  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't been initialized.
  if (gifList === null) {
    return (
      <div className="connected-container">
        <button className="cta-button submit-gif-button" onClick={createGifAccount}>
          Do One-Time Initialization For GIF Program Account
        </button>
      </div>
    )
  } 
	// Otherwise, we're good! Account exists. User can submit GIFs.
	else {
    const provider = getProvider();
    return(
      <div className="connected-container">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendGif();
          }}
        >
          <input
            type="text"
            placeholder="Enter gif link!"
            value={inputValue}
            onChange={onInputChange}
          />
          <button type="submit" className="cta-button submit-gif-button">
            Submit
          </button>
        </form>
        <div className="gif-grid">
					{/* We use index as the key instead, also, the src is now item.gifLink */}
          {gifList.map((item, index) => (
            <div className="gif-item" style={{display:"flex",alignItems:"center"}} key={index}>
              <img id="img" alt={item.userAddress.toString()} src={item.gifLink} />
              {item.userAddress.toString()==provider.wallet.publicKey?<><br/><button className={"cta-button remove-gif-button"} onClick={(event) => {
            event.preventDefault();
            removeGif(event);
          }}><RiDeleteBin6Line/> Remove this Gif</button></>:<><span className={"sub-text"} >Owner:  </span><p className={"sub-text-owner"} style={{width:"200px",textOverflow: "ellipsis",whiteSpace: "nowrap",display: "block",overflow: "hidden"}}>{item.userAddress.toString()}</p></>}
            </div>
          ))}
        </div>
      </div>
    )
  }
  }
  const sendGif = async () => {
  if (inputValue.length === 0) {
    console.log("No gif link given!")
    return
  }
  setInputValue('');
  console.log('Gif link:', inputValue);
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);

    await program.rpc.addGif(inputValue, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });
    console.log("GIF successfully sent to program", inputValue)

    await getGifList();
  } catch (error) {
    console.log("Error sending GIF:", error)
  }
};

  const removeGif = async (event) => {
   let value =  event.target.closest("div").querySelector("#img").src;
    try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);

    await program.rpc.removeGif(value, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });
    console.log("GIF successfully removed from program", inputValue)

    await getGifList();
  } catch (error) {
    console.log("Error removing GIF:", error)
  }
  }
  
useEffect (()=> {
  const onLoad = async () => {
    await checkIfWalletIsConnected();
  };
  window.addEventListener('load',onLoad);
  return () => window.removeEventListener('load',onLoad);
}, []);

  const getGifList = async() => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    
    console.log("Got the account", account)
    setGifList(account.gifList)

  } catch (error) {
    console.log("Error in getGifList: ", error)
    setGifList(null);
  }
}
  
useEffect(() => {
  if (walletAddress) {
    console.log('Fetching GIF list...');
    getGifList()
  }
}, [walletAddress]);
  
  return (
    <div className="App" style={{overflow: "unset !important"}}>
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">📷 GIFTEREST</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <span className={"footer-text"}>Made On Solana By Delvlooping</span>
        </div>
      </div>
    </div>
  );
};

export default App;
