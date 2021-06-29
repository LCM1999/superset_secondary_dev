/*
    buchuan1023@gmail.com
    buchuan1023自定义函数库
    2019.4.8
*/

/*
    前排提示，所有的ID和属性判定都是先转为String再判定的。目前比较符合我的需求
*/

/*
函数：生成a-b的随机整数（包含a，b）,a，b不为整数则向下取整
参数：
    a:最小值整数
    b:最大值整数
备注:a<b
*/
export function getRandom(a, b) {
    a = Math.floor(a);
    b = Math.floor(b);
    if (a > b)
        [a, b] = [b, a];
    return Math.round(Math.random() * (b - a) + a);
}

/*
函数:数组查重
参数:
    num:数组
    value:待查重元素
备注:
*/
export function numContains(num, value) {
    for (let i = 0; i < num.length; i++)
        if (num[i] === value)
            return true;
    return false;
}

/*
函数:根据数组元素的id 检验是否存在元素
参数:
    num:数组
    value:待查重元素
备注:
*/
export function numContainsByID(num, value_id, id = "id", log = false) {
    if (num === undefined) {
        console.log("ERROR:::Function:numContainsByID.this array is undefined");
        return;
    } else if (num.length === 0) {
        console.log("ERROR:::Function:numContainsByID.this array is empty");
        return;
    }
    for (let i = 0; i < num.length; i++)
        if (num[i][id] + "" === value_id + "")
            return true;
    if (log) {
        console.log("ERROR:::Function:numContainsByID there is no such Element. ID: " + value_id)
    }
    return false;
}

/*
函数:从数组中得到对应元素的index
参数:
    num:数组
    id:数组元素ID的名字，例如'id','pid','lid'
    value:属性的值
备注:
*/
export function getNumElementIndex(num, value) {
    //测试变量类型
    // console.log(typeof(num[0]));
    // console.log(typeof(value));
    for (let i = 0; i < num.length; i++) {
        if (num[i] + "" === value + "") {
            return i;
        }
    }
    // printToConsole('Function:getNumElementByID can not find this element. ID:'+id)
    console.log("ERROR:::Function:getNumElementIndex can not find this element's index. value:" + value);

    return -1;
}

/*
函数:从数组中得到对应ID的元素索引
参数:
    num:数组
    id:数组元素ID的名字，例如'id','pid','lid'
    IDValue:id的值
备注:
*/
export function getNumElementIndexByID(num, IDValue, id = 'id') {
    //测试变量类型
    // console.log(typeof(num[0][id]));
    // console.log(typeof(IDValue));

    for (let i = 0; i < num.length; i++) {
        if (num[i][id] + "" === IDValue + "") {
            return i;
        }
    }
    // printToConsole('Function:getNumElementByID can not find this element. ID:'+id)
    console.log("ERROR:::Function:getNumElementIndexByID can not find this element's index. ID:" + id + " " + IDValue);

    return -1;
}
/*
函数:从数组中得到对应ID的元素
参数:
    num:数组
    id:数组元素ID的名字，例如'id','pid','lid'
    IDValue:id的值
备注:
*/
export function getNumElementByID(num, IDValue, id = 'id') {
    //测试变量类型
    // console.log(typeof(num[0][id]));
    // console.log(typeof(IDValue));
    for (let i = 0; i < num.length; i++) {
        if (num[i][id] + "" === IDValue + "") {
            return num[i];
        }
    }
    // printToConsole('Function:getNumElementByID can not find this element. ID:'+id)
    console.log('ERROR:::Function:getNumElementByID can not find this element. ID:' + id + " " + IDValue);

    return -1;
}

/*
函数:从数组中得到对应属性的元素
参数:
    num:数组
    id:数组元素ID的名字，例如'id','pid','lid'
    attrValue:属性的值
备注:
*/
export function getNumElementsByAttribute(num, attrValue, attr) {
    let result = [];
    for (let i = 0; i < num.length; i++) {
        if (num[i][attr] + "" === attrValue + "") {
            result.push(num[i]);
        }
    }
    if (result.length === 0) {
        console.log("WARN:::Function:getNumElementIndexByID. The Result Is Empty. Attribute: " + attrValue);
    }
    return result;
}

/*
函数:将多维数组()按照遍历顺序转为1维数组.递归调用这个方法
参数:
备注:
*/
export function turnHighDimensionArraytoOneDimensionArray(array) {
    if (array === undefined) {
        console.log('ERROR:::Function:turnHighDimensionArraytoOneDimensionArray. This Array is Undefined');
        return;
    } else if (!(array instanceof Array)) {
        let cur = [];
        cur.push(array);
        return cur;
    }
    let result = [];
    for (let i = 0; i < array.length; i++) {
        result = result.concat(turnHighDimensionArraytoOneDimensionArray(array[i]));
    }
    return result;
}

// rgb转16进制颜色
export function zero_fill_hex(num, digits) {
    var s = num.toString(16);
    while (s.length < digits) s = "0" + s;
    return s;
}

export function rgb2hex(rgb) {
    if (rgb.charAt(0) == '#') return rgb;
    var ds = rgb.split(/\D+/);
    var decimal = Number(ds[1]) * 65536 + Number(ds[2]) * 256 + Number(ds[3]);
    return "#" + zero_fill_hex(decimal, 6);
}

/*
函数:创建对应有元素个数的数组，并填充指定value
参数:
备注:
*/
export function getArray(len, value = 0) {
    if (len < 0) {
        console.log('ERROR:::Function:getArray. the length is illegal');
    }
    let cur = [];
    for (let i = 0; i < len; i++) {
        cur.push(value);
    }
    return cur;
}
/*
函数:创建对应有元素个数的2维数组lenA*lenB，并填充指定value
参数:
备注:
*/
export function getArray2D(lenA, lenB, value = 0) {
    if (lenA < 0 || lenB < 0) {
        console.log('ERROR:::Function:getArray. the length is illegal');
    }
    let cur = [];
    for (let i = 0; i < lenA; i++) {
        cur.push([]);
        for (let j = 0; j < lenB; j++) {
            cur[i].push(value);
        }
    }
    return cur;
}

/*
函数:创建对应有元素个数的3维数组lenA*lenB*lenC，并填充指定value
参数:
备注:
*/
export function getArray3D(lenA, lenB, lenC, value = 0) {
    if (lenA < 0 || lenB < 0 || lenC < 0) {
        console.log('ERROR:::Function:getArray3D. the length is illegal');
    }
    let cur = [];
    for (let i = 0; i < lenA; i++) {
        cur.push([]);
        for (let j = 0; j < lenB; j++) {
            cur[i].push([]);
            for (let k = 0; k < lenC; k++) {
                cur[i][j].push(value);
            }
        }
    }
    return cur;
}


/*
函数:将数组进行shuffle排序
参数:
    num:数组
备注:
*/
export function shuffle(num) {
    if (num.length === 0)
        return;
    let num2 = A_Copy_Of(num);
    for (let i = num2.length - 1; i >= 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [num2[i], num2[j]] = [num2[j], num2[i]];
    }
    return num2;
}


/*
函数:复制一个对象，可以是数组、对象等等
参数:
备注:
*/
export function copyObject(object) {
    return JSON.parse(JSON.stringify(object));
}

/*
函数:得到一个数组的中位数
参数:
备注:
*/
export function getMedian(num) {
    if (num.length === 0) {
        console.log('ERROR:::Function:getMedian. the array\'s length is 0');
        return -1;
    }
    let num2 = copyObject(num);
    num2.sort(function (a, b) {
        return a - b;
    });
    if (num2.length % 2 === 0) {
        return (num2[num2.length / 2 - 1] + num2[num2.length / 2]) / 2;
    } else {
        return num2[(num2.length - 1) / 2];
    }
}


/*
函数:获得方差
参数:
备注:
*/
export function getDeviation(num) {
    if (num.length === 0) {
        console.log('ERROR:::Function:getDeviation. the array\'s length is 0');
        return -1;
    }
    let sum = 0;
    for (let i = 0; i < num.length; i++) {
        sum += num[i];
    }
    let average = sum / num.length;
    let res = 0;
    for (let i = 0; i < num.length; i++) {
        res += (num[i] - average) * (num[i] - average);
    }
    res /= num.length;
    return res;
}

/*
函数:或者标准差
参数:
备注:
*/
export function getStandardDeviation(num) {
    if (num.length === 0) {
        console.log('ERROR:::Function:getStandardDeviation. the array\'s length is 0');
        return -1;
    }
    let res = getDeviation(num);
    res = Math.sqrt(res);
    return res;
}


/*
函数:得到一个数组的四分位数，
参数:
备注:返回值是Q1,Q2,Q3,分别是较小四分位数，中值，较大四分位数
*/
export function getNumQuantiles(num) {
    if (num.length === 0) {
        console.log('ERROR:::Function:getQuantiles. the array\'s length is 0');
        return -1;
    }
    if (num.length === 1) {
        return [num[0], num[0], num[0]];
    }
    let num2 = copyObject(num);
    num2.sort(function (a, b) {
        return a - b;
    });
    let Q1 = 0,
        Q2 = 0,
        Q3 = 0;
    Q2 = getMedian(num2);
    if (num2.length % 2 === 0) {
        let lowerNum = num2.slice(0, num2.length / 2);
        Q1 = getMedian(lowerNum);
        let upperNum = num2.slice(num2.length / 2, num2.length);;
        Q3 = getMedian(upperNum);
    } else if (num2.length % 4 === 1) {
        let n = (num2.length - 1) / 4;
        Q1 = 0.25 * num2[n - 1] + 0.75 * num2[n];
        Q3 = 0.75 * num2[3 * n] + 0.25 * num2[3 * n + 1];
    } else if (num2.length % 4 === 3) {
        Q1 = 0.75 * num2[n] + 0.25 * num2[n + 1];
        Q3 = 0.25 * num2[3 * n + 1] + 0.75 * num2[3 * n + 2];
    }
    return [Q1, Q2, Q3];
}

/*
函数:根据一个数组的四分位数，得到数组的异常值
参数:数组，较小四分位数，中值，较大四分位数
备注:
*/
export function getNumOutlierByQuantiles(num, Q1 = undefined, Q2 = undefined, Q3 = undefined) {
    if (num.length === 0) {
        console.log('ERROR:::Function:getQuantiles. the array\'s length is 0');
        return -1;
    }
    if (Q1 === undefined) {
        let curQs = getQuantiles(num);
        Q1 = curQs[0];
        Q2 = curQs[1];
        Q3 = curQs[2];
    }
    let num2 = copyObject(num);
    let IQR = Q3 - Q1;
    let lowOutliers = [],
        upOutliers = [];
    num2.sort(function (a, b) {
        return a - b
    });
    //首先获得小的异常值
    for (let i = 0; i < num2.length; i++) {
        if (num2[i] < (Q1 - 1.5 * IQR)) {
            lowOutliers.push(num2[i]);
        } else {
            break;
        }
    }
    //然后获得大的异常值
    for (let i = num2.length - 1; i >= 0; i--) {
        if (num2[i] > (Q3 + 1.5 * IQR)) {
            upOutliers.push(num2[i]);
        } else {
            break;
        }
    }
    return [lowOutliers, upOutliers];
}

// /*
// 函数:
// 参数:
// 备注:
// */
// function printToConsole(sth){
//     console.log(sth);   
// }


export function copyUrl2() {
    var Url2 = document.getElementById("StringData");
    Url2.select(); // 选择对象
    document.execCommand("Copy"); // 执行浏览器复制命令
    // alert("已复制好，可贴粘。");
}
// <textarea cols="20" rows="10" id="StringData">用户定义的代码区域</textarea>
// <input type="button" onClick="copyUrl2()" value="点击复制代码" />
// document.getElementById("StringData").innerHTML = JSON.stringify(OBJ);

/*
函数:得到随机颜色
参数:
备注:
*/
export function getRandomColorRGB() {
    // return "rgb(178, 223, 138)";
    return "rgb(" + getRandom(0, 255) + ", " + getRandom(0, 255) + ", " + getRandom(0, 255) + ")";
}

/*
函数:得到一个字符的unicode编码
参数:
备注:
*/
export function getUnicode(char){
    str = char+"a";
    return str.charCodeAt(0);
}

/**
 * 复制一个元素并返回
 * @param {要复制的元素} ele 
 */
export function A_Copy_Of(ele) {
    return JSON.parse(JSON.stringify(ele))
}