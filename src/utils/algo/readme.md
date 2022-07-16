## algo 标准函数
algo 函数，本意为 输入一个array，输出一个array
但由于构造一个array，消耗性能，所以，在可能的情况下，返回一个index 数组

为了保证可读性（可复制粘贴性），做以下约定
### 传入参数
1. 传入参数，第一个必须是 bufferAttribute,最后一个是config
2. 除开最后一个，其他不可为空/省略
2. 所有传入参数不要修改其值，make it functional

### 返回值
3. 返回值为一个对象，根据情况，如果无需生成新 bufferAttribute，则近返回`{indices}`, 否则 返回 `{indices,bufferAttribute}`
4. indices是array
5. bufferAttribute 指 [three.BufferAttribute ](https://threejs.org/docs/index.html?q=buff#api/en/core/BufferAttribute)

### 假设使用者了解该 algo 实现
1. 总是假设使用者了解该算法的（基本）细节
2. 算法不应过长
3. copy and paste，don't write a lib 算法总是针对特殊场景的，大部分情况下，不要作为通用函数去构造

```javascript
function algoFunc(inputBufferAttribute,...,config={indices,...}){
return {indices,bufferAttributes}
}
```
