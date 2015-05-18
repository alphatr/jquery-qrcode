# jQuery-qrcode 使用说明

简介：jQuery-qrcode 是一个前端的二维码生成库，二维码核心无依赖，针对 jquery 提供了简单的调用，使用方法如下：

### 二维码生成
```javascript
// 在 ID 为 qrcode-div 的 DOM 上生成二维码
$('#qrcode-div').qrcode('sometext encode to qrcode');
```

### 二维码解码
```javascript
// 选择器选择 canvas 元素，(或者 canvas 的父级)；返回解码结果
var decoded = $('canvas').qrdecode();
```


#### 文档参考

在生成二维码的时候参数可以是 _String_ 也可以是 _Object_，String 时会将字符串用默认参数生成二维码，Object 可以使用的参数如下：

**参数格式**

* `text` _String_

    生成二维码的文字，默认值为 "Test"；

* `render` _String_

    渲染方式; 可取值范围为 ["canvas", "table"], 默认值为 "canvas", 使用 Canvas 元素渲染；

* `bgColor` _String_

    背景色，格式如 "#ADFC23" 或 "#234" 等十六进制 CSS 颜色值, 默认值 "#FFF"；

* `moduleColor` _String_

    前景色，（即色块的颜色）如上，默认值 "#000"；

    *注意*：前景色要比背景色深，对比要大；

* `moduleSize` _Integer_

    色块大小，默认 5px；

* `mode` _Integer_

    编码方式，可取值范围为 [1, 2, 4], 分别指数字编码，字母编码和 8bits 编码，默认使用 8bits，根据字面含义，数字编码只能编码数字，字母编码可以编码数字和字母，8bits 可以编码 utf-8 的字符；

* `ECLevel` _Integer_

    纠错码等级，可取值范围为 [0-3]，分别指代含有15%，7%，30%，25% 的纠错码，默认为最高的 30%(2)；

* `margin` _Integer_

    四周留白倍数，默认为色块大小的 4 倍（也是推荐大小）；

* `logo` _String_

    中间的 Logo url，默认为空，不渲染 Logo；

* `error` _Function_

    报错函数，默认使用 alert 弹出，接收错误字符串的参数。

***

## 源码结构

如果需要对二维码进行二次开发，各个模块的功能如下

```
├── decode.js // 核心解码模块
├── encode.js // 核心编码模块
├── qrbase.js // 公共基础模块
├── qrcode.js // jquery 编码包装对象
├── qrdecode.js // jquery 解码对象
├── reedsolomon.js // Reed-solomon 纠错码，也是编解码的核心模块
├── render.canvas.js // 依赖 jquery 的 Canvas 渲染模块
└── render.table.js // 依赖 jquery 的 Table 渲染模块
```

## 进行二次开发

如果需要使用其他渲染方式或者需要更改一些实现，可以进行二次开发；

$.qrcode.pixArr 是一个二维的数组，分别用 0 和 1 标识二维码的色块，通过循环这个数组就可以使用自己的渲染方式；

### 使用 gulp 打包

使用命令 `gulp` 或者 `gulp package` 默认会对全部文件进行压缩打包，如果只需要打包解码或者编码部分则需要添加不同的参数，参数说明如下：

* `--file`

    可取值 'decode', 'encode', 'all' 默认参数为 all，即全部打包，decode 和 encode 表示分别打包解码和编码部分；

* `--debug`

    表示 debug 模式，默认会对打包的代码进行压缩；在 debug 模式下，不会压缩；

* `--render`

    在打包了编码模块下有效，可取值 'table', 'canvas', 'all' 默认参数为 all，即全部打包，table 和 canvas 表示分别使用 canvas 和 table 渲染模块；

## 参考资料

[二维码的生成细节和原理](http://coolshell.cn/articles/10590.html)
