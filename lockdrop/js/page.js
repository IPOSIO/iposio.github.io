let provider, web3;
const MAINNET_LOCKDROP = '0xea25de72637f1258448f1d378e876d1c9ccaac19';
const ROPSTEN_LOCKDROP = '0xf78ab5cf090318608c127035eb67b05ebaac3ee6';
const LOCKDROP_ABI = JSON.stringify([{"constant":false,"inputs":[{"name":"term","type":"uint8"},{"name":"toAddr","type":"address"}],"name":"lock","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":false,"name":"eth","type":"uint256"},{"indexed":false,"name":"lockAddr","type":"address"},{"indexed":false,"name":"term","type":"uint8"},{"indexed":false,"name":"toAddr","type":"address"},{"indexed":false,"name":"time","type":"uint256"}],"name":"Locked","type":"event"}])
$(async function() {
  if (typeof window.ethereum !== 'undefined') {
    // Remove target="_blank" since it breaks links for Toshi/Coinbase Wallet
    if (window.ethereum.isToshi || window.ethereum.isCoinbaseWallet) {
      $('[target="_blank"]').removeAttr('target');
    }
  }

  $('.publickey-input').on('blur', function(e) {
    if (e.target.value !== '' && e.target.value.length !== 42 ) {
      alert('Please enter a valid 32-byte public key with or without 0x prefix');
    }
  });

  $('input[name="network"]').change(function(e) {
    let network = $('input[name="network"]:checked').val();
    if (network === 'mainnet') {
      $('#LOCKDROP_CONTRACT_ADDRESS').val(MAINNET_LOCKDROP);
      $('#ETHERSCAN_LINK').attr('href', `https://etherscan.io/address/${MAINNET_LOCKDROP}`);
    } else if (network === 'ropsten') {
      $('#LOCKDROP_CONTRACT_ADDRESS').val(ROPSTEN_LOCKDROP);
      $('#ETHERSCAN_LINK').attr('href', `https://ropsten.etherscan.io/address/${ROPSTEN_LOCKDROP}`);
    } else {
      $('#LOCKDROP_CONTRACT_ADDRESS').val(MAINNET_LOCKDROP);
      $('#ETHERSCAN_LINK').attr('href', `https://etherscan.io/address/${MAINNET_LOCKDROP}`);
    }
  });

  $('input[name="locktime"]').change(function(e) {
    var val = $('input[name="locktime"]:checked').val();
    if (val === 'signal') {
      $('.body-container').removeClass('locking');
      $('.body-container').addClass('signaling');
    } else if (val.startsWith('lock')) {
      $('.body-container').addClass('locking');
      $('.body-container').removeClass('signaling');
    } else {
      $('.body-container').removeClass('locking');
      $('.body-container').removeClass('signaling');
    }
  });


  $('button.injectedWeb3').click(async function() {
    if (!getPublicKey()) {
      return;
    }

    // Setup ethereum connection and web3 provider if possible
    await enableInjectedWeb3EthereumConnection();
    setupWeb3Provider();

    // Grab form data
    let { returnTransaction, params, failure, reason } = await configureTransaction(true);
    if (failure) {
      alert(reason);
      return;
    }
    $('.participation-option').hide();
    $('.participation-option.injectedWeb3').slideDown(100);
    $('.participation-option.injectedWeb3 .injectedWeb3-error').text('').hide();
    $('.participation-option.injectedWeb3 .injectedWeb3-success').text('').hide();
    // Send transaction if successfully configured transaction
    returnTransaction.send(params, function(err, txHash) {
      if (err) {
        console.log(err);
        $('.participation-option.injectedWeb3 .injectedWeb3-error').show()
          .text(err.message);
      } else {
        console.log(txHash);
        $('.participation-option.injectedWeb3 .injectedWeb3-prompt').hide()
        $('.participation-option.injectedWeb3 .injectedWeb3-success').show()
          .text('Success! Transaction submitted');
        $('.participation-option.injectedWeb3 .congratulations').show()
      }
    });
    $('html, body').animate({ scrollTop: $('.participation-options').position().top - 50 }, 500);
  });
  $('button.mycrypto').click(async function() {
    if (!getPublicKey()) {
      return;
    }

    // Setup ethereum connection and web3 provider if possible
    setupWeb3Provider();

    let { failure, reason, args } = await configureTransaction(false);
    if (failure) {
      alert(reason);
      return;
    }
    $('.participation-option').hide();
    $('.participation-option.mycrypto').slideDown(100);
    // Create arg string
    let myCryptoArgs = Object.keys(args).map((a, inx) => {
      if (inx == Object.keys(args).length - 1) {
        return `${a}: ${args[a]}`;
      } else {
        return `${a}: ${args[a]}\n`;
      }
    }).reduce((prev, curr) => {
      return prev.concat(curr);
    }, "");

    $('#LOCKDROP_MYCRYPTO_CONTRACT_ADDRESS').text($('#LOCKDROP_CONTRACT_ADDRESS').val());
    $('#LOCKDROP_MYCRYPTO_ABI').text(LOCKDROP_ABI);
    $('#LOCKDROP_MYCRYPTO_ARGUMENTS').text(myCryptoArgs);
    if ($('input[name=locktime]:checked').val() === 'signal') {
      $('#LOCKDROP_MYCRYPTO_VALUE').hide();
    } else {
      $('#LOCKDROP_MYCRYPTO_VALUE').show().text('Value: ' + $('#ETH_LOCK_AMOUNT').val());
    }
    $('html, body').animate({ scrollTop: $('.participation-options').position().top - 50 }, 500);
  });
 

  $('button.commonwealth-ui').click(function() {
    $('.generate-option').hide();
    $('.generate-option.commonwealth-ui').slideDown(100);
  });

  $('button.rust').click(function() {
    $('.generate-option').hide();
    $('.generate-option.rust').slideDown(100);
  });
});

async function configureTransaction(isInjectedWeb3) {
  let failure = false;
  let returnTransaction, params, reason, args;

  let lockdropContractAddress = $('#LOCKDROP_CONTRACT_ADDRESS').val();
  let toAddr = getPublicKey();

  let lockdropLocktimeFormValue = $('input[name=locktime]:checked').val();
  let validatorIntent = ($('input[name=validator]:checked').val() === 'yes') ? true : false;
  // Grab lockdrop JSON and instantiate contract
  const json = await $.getJSON('Lockdrop.json');
  const contract = new web3.eth.Contract(json.abi, lockdropContractAddress);

  const userSelectedNetwork = $('input[name="network"]:checked').val();
  if (isInjectedWeb3) {
    const walletSelectedNetwork = await web3.eth.net.getNetworkType();
    console.log(walletSelectedNetwork)
    if (walletSelectedNetwork === 'main' && userSelectedNetwork === 'ropsten') {
      alert('You are interacting with the Ropsten testnet contract. Please switch your wallet to Ropsten')
      return;
    }
  } else {
    if (userSelectedNetwork === 'ropsten') {
      $('.ropsten-address-warning').show();
    } else {
      $('.ropsten-address-warning').hide();
    }
  }

  // Switch on transaction type
  const signaling = (lockdropLocktimeFormValue === 'signal');
  if (!signaling) {
    let ethLockAmount = $('#ETH_LOCK_AMOUNT').val();
    if (isNaN(+ethLockAmount) || +ethLockAmount <= 0) {
      alert('Please enter a valid ETH amount!');
      return;
    }

    // Calculate lock term as enum values
    const lockdropLocktime = (lockdropLocktimeFormValue === 'lock3') ?
          0 : ((lockdropLocktimeFormValue === 'lock6') ?
               1 : 2);

    // Params are only needed for sending transactions directly i.e. from InjectedWeb3
    if (isInjectedWeb3) {
      const coinbaseAcct = await web3.eth.getCoinbase();
      params = {
        from: coinbaseAcct,
        value: web3.utils.toWei(ethLockAmount, 'ether'),
        gasLimit: 150000,
      };
    }
    returnTransaction = contract.methods.lock(lockdropLocktime, toAddr);
    args = {
      term: lockdropLocktime,
      toAddr: toAddr,
    };
  } else {
    if (isInjectedWeb3) {
      const coinbaseAcct = await web3.eth.getCoinbase();
      params = { from: coinbaseAcct, gasLimit: 150000 };
    }

    // FIXME: Create these inputs for signalers
    let signalingContractAddress = $('#SIGNALING_CONTRACT_ADDR').val();
    let signalingContractNonce = $('#SIGNALING_CONTRACT_NONCE').val();

    let res = validateSignalingContractAddress(signalingContractAddress, signalingContractNonce);
    if (!isInjectedWeb3 && res.failure) {
      return res;
    } else {
      signalingContractAddress = signalingContractAddress || params.from;
      signalingContractNonce = signalingContractNonce || 0;
    }

    returnTransaction = contract.methods.signal(signalingContractAddress, signalingContractNonce, toAddr);
    args = {
      contractAddr: signalingContractAddress,
      nonce: signalingContractNonce,
      toAddr: toAddr,
    };
  }
  return { returnTransaction, params, failure, reason, args };
}


function isHex(inputString) {
  const re = /^(0x)?[0-9A-Fa-f]+$/g;
  const result = re.test(inputString);
  re.lastIndex = 0;
  return result;
}

function getPublicKey() {
  const locktime = $('input[name=locktime]:checked').val();
  if (!locktime) {
    alert('Select lock or signal');
    return;
  }
  const key1 = $('#EDGEWARE_PUBLIC_KEY1').val();

  if (!key1 || (key1.indexOf('0x') > 0 && key1.length !== 42) || !isHex(key1)) {
    alert('Please enter a valid 32-byte public key with or without 0x prefix');
    return;
  }
 

 
  return key1;
  
}

/**
 * Ensure that the contract address and nonce are properly formatted
 */
function validateSignalingContractAddress(contractAddress, nonce) {
  if (!contractAddress || !nonce) {
    return {
      failure: true,
      reason: 'Signaled address and nonce are required if you are using MyCrypto. Use 0 for the nonce if you are signaling the address you are sending from.',
    };
  }

  if (isNaN(nonce)) {
    return {
      failure: true,
      reason: 'Nonce must be an integer',
    };
  }

  if (contractAddress.indexOf('0x') > 0 && contractAddress.length !== 42) {
    return {
      failure: true,
      reason: 'Signaled address is not valid, it contains 0x but must be 20 bytes in length',
    };
  }

  if (contractAddress.indexOf('0x') === -1 && contractAddress.length !== 40) {
    return {
      failure: true,
      reason: 'Signaled address is not valid, it does not contain 0x nor is it 20 bytes',
    };
  }

  return { failure: false };
}

/**
 * Setup web3 provider using InjectedWeb3's injected providers
 */
function setupWeb3Provider() {
  // Setup web3 provider
  if (typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')) {
    // Web3 browser user detected. You can now use the provider.
    provider = window.ethereum || window.web3.currentProvider;
  } else {
    // If no provider is found default to public INFURA gateway
    web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.iposlab.com'));
  }

  web3 = new window.Web3(provider);
  console.log("web3.version")
        console.log(web3.version)
}

/**
 * Enable connection between browser and InjectedWeb3
 */
async function enableInjectedWeb3EthereumConnection() {
  try {
    await ethereum.enable();
  } catch (error) {
    // Handle error. Likely the user rejected the login:
    alert('Could not find Web3 provider/Ethereum wallet, defaulting to INFURA\n\nNote, you will not be able to use the Injected Web3 option.');
  }
}
