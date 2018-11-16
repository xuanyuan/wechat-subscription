/**
 * Created with Software Dept.
 *
 * User: zhangdj
 * Date: 2018-06-23
 * Time: 下午3:09
 * Description:
 */
// 回复文字消息
exports.text = (toUser, fromUser, content) => (
  `<xml>
  <ToUserName><![CDATA[${toUser}]]></ToUserName>
  <FromUserName><![CDATA[${fromUser}]]></FromUserName>
  <CreateTime>${new Date().getTime()}</CreateTime><MsgType>
  <![CDATA[text]]></MsgType><Content><![CDATA[${content}]]></Content>
  </xml>`
)

// 回复图文消息
exports.graphic = (toUser, fromUser, contentArr) => {
  var xmlContent = `
  <xml>
    <ToUserName><![CDATA[${toUser}]]></ToUserName>
    <FromUserName><![CDATA[${fromUser}]]></FromUserName>
    <CreateTime>${new Date().getTime()}</CreateTime>
    <MsgType><![CDATA[news]]></MsgType>
    <ArticleCount>${contentArr.length}</ArticleCount>
    <Articles>`;
  contentArr.map((item, index) => {
    xmlContent += `
      <item>
        <Title><![CDATA[${item.Title}]]></Title>
        <Description><![CDATA[${item.Description}]]></Description>
        <PicUrl><![CDATA[${item.PicUrl}]]></PicUrl>
        <Url><![CDATA[${item.Url}]]></Url>
      </item>`
  });
  xmlContent += "</Articles></xml>";
  return xmlContent;
}