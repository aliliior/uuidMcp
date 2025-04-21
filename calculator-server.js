// calculator-server.js
// MCP工具服务器 - 提供UID和UUID互转功能

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 创建MCP服务器
const server = new McpServer({
  name: "UUID-MCP",
  version: "1.0.0"
});

const BASE62 = "0123456789ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

// idToShortKey 将一个 long 类型的 id 转换为短 Key（Base62 编码）
function idToShortKey(id) {
  let result = [];
  while (id > 0) {
    result.push(BASE62[id % 60]); 
    id = Math.floor(id / 60);
  }
  // 如果生成的短 Key 长度小于 6，就补充 '0'
  while (result.length < 6) {
    result.push('0');
  }
  // 反转并返回结果
  return result.reverse().join('');
}

// shortKeyToId 将短 Key（Base62 编码）转换为 id
function shortKeyToId(shortKey) {
  let id = 0;
  for (let i = 0; i < shortKey.length; i++) {
    const index = BASE62.indexOf(shortKey[i]);
    if (index === -1) {
      throw new Error(`Invalid character in shortKey: ${shortKey[i]}`);
    }
    id = id * 60 + index;
  }
  return id;
}

// 添加ID转短Key工具
server.tool("idToShortKey",
  { id: z.number().describe("需要转换的数字ID") },
  async ({ id }) => ({
    content: [{ type: "text", text: idToShortKey(id) }]
  })
);

// 添加短Key转ID工具
server.tool("shortKeyToId",
  { shortKey: z.string().describe("需要转换的短Key") },
  async ({ shortKey }) => {
    try {
      const id = shortKeyToId(shortKey);
      return {
        content: [{ type: "text", text: String(id) }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `错误：${error.message}` }]
      };
    }
  }
);

// 添加静态帮助资源
server.resource(
  "uuid-converter-help",
  "uuid-converter://help",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: `# UUID-MCP服务器使用帮助

本服务器提供ID和短Key互转功能，使用Base62编码。

## 可用工具

1. idToShortKey - 将数字ID转换为短Key
   - 参数: id (需要转换的数字ID)
   - 返回: Base62编码的短Key

2. shortKeyToId - 将短Key转换为数字ID
   - 参数: shortKey (需要转换的短Key)
   - 返回: 解码后的数字ID

## 使用示例

ID转短Key: idToShortKey(id=123456789) 返回一个6位的Base62编码字符串
短Key转ID: shortKeyToId(shortKey="abCD12") 返回对应的数字ID`
    }]
  })
);

// 创建stdio传输并连接服务器
const transport = new StdioServerTransport();

// 启动服务器
console.log("UUID-MCP服务器正在启动...");

// 连接传输层
server.connect(transport).then(() => {
  console.log("服务器已连接到传输层，等待请求...");
}).catch(error => {
  console.error("服务器启动失败:", error);
}); 
