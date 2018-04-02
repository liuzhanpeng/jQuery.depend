# jQuery.depend

让目标元素操作(如启用/禁用，显示/隐藏等)依赖于其它元素。

## 例子

```
<form id="form1">
    是否近视: 
    <select name="test1">
        <option value="">请选择</option>
        <option value="是">是</option>
        <option value="否">否</option>
    </selcet>
    是否带隐形眼镜:
    <select name="test2">
        <option value="">请选择</option>
        <option value="是">是</option>
        <option value="否">否</option>
    </select>
    使用隐形眼镜品牌:
    <input type="checkbox" name="test3[]" value="博士伦"> 博士伦
    <input type="checkbox" name="test3[]" value="视康"> 视康
    <input type="checkbox" name="test3[]" value="其它"> 其它
    如果您使用博士伦，效果如何:
    <input type="radio" name="test4" value="好"> 好
    <input type="radio" name="test4" value="差"> 差
</form>
<!--引入jQuery (Zepto应该也支持，没测试)-->
<script src="jquery.min.js"></script>
<script src="jquery.depend.min.js"></script>
<script> 
    $('#form1 [name=test2]').depend({
        '#form1 [name=test1]': {
            rule: {
                equal: '是'
            }
        }
    });
    $('#form1 [name="test3[]"]').depend({
        '#form1 [name=test1]': {
            rule: {
                equal: '是'
            }
        },
        '#form1 [name=test2]': {
            rule: {
                equal: '是'
            }
        }
    });
    $('#form1 [name="test4"]').depend({
        '#form1 [name="test3[]"]': {
            rule: {
                contain: '博士伦'
            }
        }
    });
</script>
```






