/**
 * Created with Software Dept.
 *
 * User: zhangdj
 * Date: 2018-06-23
 * Time: 下午1:06
 * Description:
 */
var http = require('http');
var urltil = require('url');
var util = require('util');
var request = require('request');
var express = require('express');
var app = express();

var config = require('./config.js');
var parseString = require('xml2js').parseString;
var msg = require('./msg.js');
var https = require('https'); //引入 htts 模块
var menus = require('./menus');

function getAccessToken() {
  return new Promise(function (resolve, reject) {
    var url = 'https://api.weixin.qq.com/cgi-bin/token?' +
      'grant_type=' + config.grant_type +
      '&appid=' + config.appid +
      '&secret=' + config.secret;
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        // console.log("getAccessToken",body) // Show the HTML for the baidu homepage.
        resolve(body);
      } else {
        console.log(error);
      }
    })
  })
}

function requestPost(url, data) {
  return new Promise(function (resolve, reject) {
    var urlData = urltil.parse(url);
    var options = {
      hostname: urlData.hostname,
      path: urlData.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data, 'utf-8')
      }
    };
    var req = https.request(options, function (res) {
        var buffer = [],
          result = '';
        res.on('data', function (data) {
          buffer.push(data);
        });
        res.on('end', function () {
          result = Buffer.concat(buffer).toString('utf-8');
          resolve(result);
        })
      })
      .on('error', function (err) {
        console.log(err);
        reject(err);
      });
    req.write(data);
    req.end();
  });
}

function setMenus() {
  return new Promise(function (resolve, reject) {
    getAccessToken().then(function (data) {
      console.log(JSON.parse(data).access_token);
      //格式化请求连接
      // var url = util.format(that.apiURL.createMenu,that.apiDomain,data);
      var url = 'https://api.weixin.qq.com/cgi-bin/menu/create?access_token=' + JSON.parse(data).access_token
      //使用 Post 请求创建微信菜单
      requestPost(url, JSON.stringify(menus))
        .then(
          function (data) {
            //将结果打印
            resolve(data);
          },
          function (data) {
            reject(data);
          });
    });
  });
}

// 组织下发消息格式
function formatMsg(fromUserName, toUserName) {
  return function (type, content) {
    console.log("+++++++", type, content);
    return msg[type](fromUserName, toUserName, content);
  }
}

// GET 请求
app.get('/', function (req, res) {
  var params = urltil.parse(req.url, true).query;
  console.log(params.echostr);
  res.send(params.echostr);
})

// POST 请求
app.post('/', function (req, res) {
  var buffer = [];
  req.on('data', function (data) {
    buffer.push(data);
  });
  req.on('end', function () {
    var msgXml = Buffer.concat(buffer).toString('utf-8');
    //解析xml
    parseString(msgXml, {
      explicitArray: false
    }, function (err, result) {
      if (err) {
        console.log(err);
        return;
      }
      result = result.xml;
      var toUserName = result.ToUserName;
      var fromUserName = result.FromUserName;
      let next = formatMsg(fromUserName, toUserName);
      let msgType = result.MsgType.toLowerCase();
      let response = '';
      if (msgType === 'event') {
        switch (result.Event.toLowerCase()) {
          case 'subscribe':
            response = next('text', '恭喜你!关注了一个僵尸号~');
            break;
          default:
            response = next('text', result.Event);
            break;
        }
      } else {
        switch (msgType) {
          case 'text':
            if (result.Content === 'm') {
              var contentArr = [{
                  Title: "Node.js 微信自定义菜单",
                  Description: "使用Node.js实现自定义微信菜单",
                  PicUrl: "http://img.blog.csdn.net/20170605162832842?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast",
                  Url: "http://blog.csdn.net/hvkcoder/article/details/72868520"
                },
                {
                  Title: "Node.js access_token的获取、存储及更新",
                  Description: "Node.js access_token的获取、存储及更新",
                  PicUrl: "http://img.blog.csdn.net/20170528151333883?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast",
                  Url: "http://blog.csdn.net/hvkcoder/article/details/72783631"
                },
                {
                  Title: "Node.js 接入微信公众平台开发",
                  Description: "Node.js 接入微信公众平台开发",
                  PicUrl: "http://img.blog.csdn.net/20170605162832842?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast",
                  Url: "http://blog.csdn.net/hvkcoder/article/details/72765279"
                }
              ];
              //回复图文消息
              response = next('graphic', contentArr);
            } else if (result.Content === 'menu') {
              setMenus()
              .then(
                function (data) {
                  // response = next('text', '修改菜单成功');
                  msg.text(fromUserName, toUserName, '修改菜单成功');
                  console.log('修改菜单成功', response);
                },
                function (data) {
                  console.log('修改菜单失败！');
                }
              );
            } else {
              response = next('text', result.Content);
            }
            break;
          case 'location':
            response = next('text', '中联U谷2.5产业园(市北区上清路16号),不见不散哦~');
            break;
          case 'image':
            response = next('text', '你发了一个图片');
            break;
          case 'voice':
            response = next('text', '暂时无法识别语音');
            break;
          default:
            response = next('text', 'result.MsgType');
            break;
        }
      }
      res.send(response);
      console.log(result, "-----------", response, "================");
    })
  });
})

var server = app.listen(80, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('application instance is http://%s:%s', host, port);
})