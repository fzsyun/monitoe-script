const cron = require('node-cron');
const express = require('express')
const app = express()

const departure = "成都";
const arrive = "深圳";
const accessKey = "oijaS63RrSXInDpwRb52r9_xsatI";
const hookUrl = "https://open.feishu.cn/open-apis/bot/v2/hook/5c90e7ae-7a9a-4504-9428-b4c5a71c0dd8";
const getDate = (num) => {
    const currentDate = new Date(new Date().getTime() + 86400000 * num);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
// {
//     "depDate": "2024-07-01",
//     "flightNo": "ZH9412",
//     "airCode": "ZH",
//     "airCraft": "空客321(中)",
//     "depCode": "CTU",
//     "depCity": "成都双流",
//     "depTime": "20:30",
//     "depName": "双流T2",
//     "stops": "",
//     "arrCode": "SZX",
//     "arrCity": "深圳",
//     "arrTime": "23:15",
//     "arrName": "宝安T3",
//     "throwCode": "HAK",
//     "throwName": "海口",
//     "price": 640
// }

const main = async (day) => {
    const templates = []
    for (let i = 0; i < day; i++) {
        let date = getDate(i);
        const url = `https://www.earlytrip.fun/S/xcx_GetFlightList_v2?dep=${departure}&arr=${arrive}&date=${date}&type=ec&u=${accessKey}`;
        //拉取数据
        let response = await fetch(url);
        let data = await response.json();
        //价格排序
        let list = data['flightList'];
        list.sort((a, b) => a.price - b.price);
        //输出前三
        let slice = list.slice(0, 3);
        slice.filter(e => e.price < 500).forEach(e => {
            let template = '';
            template += `${e.flightNo} - ￥${e.price}\n`;
            template += e.throwName ? `${e.depName} - ${e.arrName} - ${e.throwName}\n` : `${e.depName} - ${e.arrName}\n`;
            template += `${e.depDate} - ${e.depTime} - ${e.arrTime}\n`;
            templates.push(template)
        });
    }
    let message = "未查询到低于500的机票。"
    if (templates.length !== 0) {
        message = templates.join('\n');
    }
    //推送消息
    const requestOptions = {
        method: 'POST', // 指定请求方法为 POST
        headers: {
            'Content-Type': 'application/json'
        }, body: JSON.stringify({
            msg_type: 'text', content: {
                'text': message
            }
        })
    };
    fetch(hookUrl, requestOptions).then(data => console.log('推送成功')).catch(error => console.error('推送失败：' + error));
}

//监控三天内，最低的前三个机票行程。
app.post('/', (req, res) => {
    main(5).then();
    res.send('这里什么也没有。')
})
// //30 23 * * * 北京时间7点30
// cron.schedule('30 23 * * *', () => {
//     console.log('Executing scheduled task...' + new Date());
//     main(5).then();
// });
// //0 4 * * * 北京时间12点00
// cron.schedule('0 4 * * *', () => {
//     console.log('Executing scheduled task...' + new Date());
//     main(5).then();
// });
// //30 9 * * * 北京时间17点30
// cron.schedule('30 9 * * *', () => {
//     console.log('Executing scheduled task...' + new Date());
//     main(5).then();
// });
app.listen(3000, () => {
    console.log(`Example app listening on port {3000}`)
})
module.exports = app