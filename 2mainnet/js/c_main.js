var Eos = require('eosjs')

var typ = 'db'
var my_title = 'IPOS 主网映射'

var who = ''
var priv_key = '5KPChcWXgFvdVkwVa5VtSpHdLkyingvEMXRozp3PP5AnXhfhmcM' //for test
var address

var eos_balance = 0.0
var lot_balance = 0.0

var ex_rate = 1000
var per_hit = 100
var max_hit = 50
var deduction = 10

var is_mainnet = true

var tp_connected = false
var mds_connected = false

//scatter

var sct_connected = false
var scatter
var sct_eos

const network = {
    blockchain:'eos',
    host:'api.tokenika.io',
    port:443,
    chainId:'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
  }

document.addEventListener('scatterLoaded', scatterExtension => {
    scatter = window.scatter
    //window.scatter = null
    if (tp_connected == false && mds_connected == false) {

        sct_eos = scatter.eos( network, Eos, {}, 'https' )

        sct_connected = true

        scatter.getIdentity({accounts: [network]}).then(identity => {
            $('#div_account_info').show()
            $('#div_i_exchange').show()
            $('#div_i_hit').show()

            $('#div_tp').hide()
            who = identity.accounts[0].name;

            $('#div_account_name').html('账号名称：' + who)
           

        }).catch(function(error) {
            $('#div_tp').hide()
            alert('请先解锁(Unlock) Scatter并刷新页面')
        })
    }
})

$(document).ready(function() {
    
    var url = window.location.href
    i = url.indexOf('?')
    if (i > 0) {
        j = url.indexOf('&w=')
        if (j > 0) {
            who = url.substring (j + 3)
            t = url.substring(i + 1, j)
            
        } 
        else 
            t = url.substring(i + 1)

        if (t == 'db' || t == '3d')
            typ = t
    }
    
    if (mobilecheck()) {
        $('#div_banner_mo').show()
    } else {
        $('#div_banner').show()
    }

    if (typ == '3d') {
        my_title = '3D - EOS'
        $('#div_hit_number').html('3')
    }
    
    $('#div_typ').html(my_title)

    if (is_mainnet) {

        tp_connected = tp.isConnected()
    
        if (tp_connected) {
            tp.getCurrentWallet().then(function (o) {
                if (o['result'] == true && o['data']['blockchain_id'] == 4) {
                    who = o['data']['name']
                    address = o['data']['address']
                    $('#div_account_name').html('账号名称：' + who)
                    
                }
            });
        }
        else 
        {
            $('#div_account_info').hide()
            $('#div_i_exchange').hide()
            $('#div_i_hit').hide()

            $('#div_tp').show()

            if (typeof $.mdseos == 'object') 
            {
                $.mdseos.init(
                    {"nodes":[
                    {"jsonRpc":"https://mainnet.eoscannon.io",'chainID':'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'}, // 0: testnet-node
                    {"jsonRpc":"http://eosmainnet.medishares.net",'chainID':'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'}  // 1: mainnet-node
                    ]}
                );
                
                $.mdseos.app_get_account(function() {
                    /*if (account_info != undefined && account_info.account != undefined ) {
                        mds_connected = true
                        who = account_info.account
                        $('#div_account_name').html('账号名称：' + who)
                        get_balance()
                    } */
                    mds_connected = true
                    who = $.mdseos.getAccount();
                    $('#div_account_name').html('账号名称：' + who)

                    $('#div_account_info').show()
                    $('#div_i_exchange').show()
                    $('#div_i_hit').show()

                    $('#div_tp').hide()

                    get_balance()
                })
            }
        }
    }
    else 
    {
        $('#div_account_name').html('账号名称：' + who)
        $('#div_tp').show()
       
    }

   
})

$('#amount').change(function() {
    $('#div_exchange_info').hide()
})

$('#amount').keydown(function() {
    $('#div_exchange_info').hide()
})

$('#btn_exchange').click(function() {
    
    if (is_mainnet && tp_connected && address == undefined) {
        $('#div_exchange_info').html('<br><font color="red">未获取到当前账号地址，请退出重新进入</font>')
        $('#div_exchange_info').show()
        return
    }

    i_amount = parseFloat($('#amount').val())
    if (i_amount <= 0 || isNaN(i_amount)) {
        
        $('#div_exchange_info').html('<br><font color="red">输入的兑换数量错误</font>')
        $('#div_exchange_info').show()
        return
    }

    amount = $('#amount').val()
    
    if (is_mainnet) {
        if (tp_connected) {
            params = {
                from: who,
                to: 'oo1122334455',
                amount: amount,
                tokenName: 'EOS',
                precision: 4,
                contract: 'eosio.token',
                memo: '',
                address: address
            }

            tp.eosTokenTransfer(params).then(function(o){
                if (o['result']) {
                    $('#div_exchange_info').html('<br><font color="green">兑换成功，请检查余额</font>')
                    get_balance()
                } else {
                    $('#div_exchange_info').html('<br><font color="red">兑换出错，请稍后再试</font>')
                }

                $('#div_exchange_info').show()
            })

        } else if (mds_connected) {
            
            transfer_action = {
                actions:[{
                    account: 'eosio.token', 
                    name: 'transfer',
                    authorization: [{
                        actor: "from",
                        permission: 'active'
                    }],
                    data: {
                        "from": "from",
                        "to": 'oo1122334455',
                        "quantity": "quant",
                        "memo": ''
                    }
                }]
            }
        
            transfer_action['actions'][0]['authorization'][0]['actor'] = who
            transfer_action['actions'][0]['data']['from'] = who
            transfer_action['actions'][0]['data']['quantity'] = i_amount.toFixed(4) + " EOS"
            
            var mdseos = $.mdseos.getEos()
            mdseos.transaction(transfer_action, function(error, result) {
                if (error) {
                    $('#div_exchange_info').html('<br><font color="red">兑换出错，请稍后再试</font>')
                }  else {
                    $('#div_exchange_info').html('<br><font color="green">兑换成功，请检查余额</font>')
                    get_balance()
                }

                $('#div_exchange_info').show()
            })
        } else if (sct_connected) {

            transfer_action = [{
                account: 'eosio.token',
                name: 'transfer',
                authorization: [{
                    actor: who,
                    permission: 'active'
                }],
                data: {
                    "from": who,
                    "to": "oo1122334455",
                    "quantity": i_amount.toFixed(4) + ' EOS',
                    "memo": ""
                }
            }]
            
            sct_eos.transaction({actions: transfer_action}, function(error, result) {
                if (error) {
                    $('#div_exchange_info').html('<br><font color="red">兑换出错，请稍后再试</font>')
                }  else {
                    $('#div_exchange_info').html('<br><font color="green">兑换成功，请检查余额</font>')
                }

                $('#div_exchange_info').show()
            
            })
        }
    }
})

$('#number').change(function() {
    $('#div_hit_info').hide()
})

$('#number').keydown(function() {
    $('#div_hit_info').hide()
})

$('#hits').change(function() {
    $('#div_hit_info').hide()
})

$('#hits').keydown(function() {
    $('#div_hit_info').hide()
})

$('#chk_hit').change(function() {
    if ($(this).prop('checked'))
        $('#div_hit_info').hide()
})

function checkEthaddr(s){
    var regu =/^0x[0123456789abcdef]{40}/;
    var re = new RegExp(regu);
    if (re.test(s)) {
            return true;
        }else{
           return false;
        }
}

$('#btn_hit').click(function() {
    $('#div_hit_info').html('')

    if (!$('#chk_hit').prop('checked')) {
        $('#div_hit_info').html('<br><font color="red">请选中‘我已知晓并同意映射规则’</font>')
        $('#div_hit_info').show()
        return
    }

    if (is_mainnet && tp_connected && address == undefined) {
        $('#div_hit_info').html('<br><font color="red">未获取到当前账号地址，请退出重新进入</font>')
        $('#div_hit_info').show()
        return
    }

    
    number = $('#number').val() 
    if (typ == 'db' && !checkEthaddr(number)) {
        $('#div_hit_info').html('<br><font color="red">映射地址必修是eth格式地址</font>')
        $('#div_hit_info').show()
        return;
    }

    i_amount = $('#hits').val()
    
    if (i_amount <= 100 || isNaN(i_amount) ) {
        $('#div_hit_info').html('<br><font color="red">输入的数量不正确</font>')
        $('#div_hit_info').show()
        return
    }

   

    amount = i_amount 
    
    

    if (is_mainnet) {

        transfer_action = [{
            account: 'oo1122334455', 
            name: 'transfer',
            authorization: [{
                actor: who,
                permission: 'active'
            }],
            data: {
                "from": who,
                "to": 'ipos2mainnet',
                "quantity": amount.toFixed(4) + ' IPOS',
                "memo":  number
            }
        }]

        if (tp_connected) {

            params = {
                from: who,
                to: 'ipos2mainnet',
                amount: amount,
                tokenName: 'IPOS',
                precision: 4,
                contract: 'eosio.token',
                memo: number,
                address: address
            }

            tp.eosTokenTransfer(params).then(function(o){
                if (o['result']) {
                    $('#div_hit_info').html('<br><font color="green">映射成功请到浏览器查看</font>')
            
                   
                } else {
                    $('#div_hit_info').html('<br><font color="red">映射失败</font>')
                }
                $('#div_hit_info').show()
            })

        } else if (mds_connected) {

            $.mdseos.getEos().transaction({actions: transfer_action}, function(error, result) {
                if (error) {
                    $('#div_hit_info').html('<br><font color="red">映射失败</font>')
                }  else {
                    $('#div_hit_info').html('<br><font color="green">映射成功请到浏览器查看</font>')
            
                   
                }

                $('#div_hit_info').show()
            })
        } else if (sct_connected) {

            sct_eos.transaction({actions: transfer_action}, function(error, result) {
                if (error) {
                    $('#div_hit_info').html('<br><font color="red">映射失败</font>')
                }  else {
                    $('#div_hit_info').html('<br><font color="green">映射成功请到浏览器查看</font>')
            
                   
                }

                $('#div_hit_info').show()
            })
        }
        
    } 
})


function timestamp2str(timestamp) {
    timestamp += 8 * 60 * 60
    now = new Date()
    now.setTime(timestamp*1000)
    
    year = now.getUTCFullYear()
    month = now.getUTCMonth()+1
    day = now.getUTCDate()
    hour = now.getUTCHours()
    minute = now.getUTCMinutes()
  
    return year+'年'+month + '月'+ day + '日' + hour +'时' + minute + '分'
}

function pad0(str)
{
  return ('0'+str).slice(-2)
}

mobilecheck = function() {
    var check = false;
    (function(a,b){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
}
