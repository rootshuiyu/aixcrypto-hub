/**
 * NestJS 字节码编译脚本
 * 将 dist/ 目录下的 JS 文件编译为 V8 字节码
 */

const bytenode = require('bytenode');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const outputDir = path.join(__dirname, '../compiled');

// 需要跳过编译的文件（保持原样）
const skipFiles = [
  '.d.ts',
  '.map',
  '.json',
];

// 递归编译目录
function compileDirectory(dir, outDir) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const outPath = path.join(outDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      compileDirectory(filePath, outPath);
    } else if (file.endsWith('.js')) {
      try {
        // 编译为字节码
        const jscPath = outPath.replace('.js', '.jsc');
        bytenode.compileFile(filePath, jscPath);
        
        // 创建加载器
        const relativePath = path.relative(path.dirname(outPath), jscPath).replace(/\\/g, '/');
        const loaderContent = `require('bytenode');module.exports=require('./${relativePath}');`;
        fs.writeFileSync(outPath, loaderContent);
        
        console.log(`✅ Compiled: ${file}`);
      } catch (error) {
        console.error(`❌ Failed to compile ${file}:`, error.message);
        // 编译失败时复制原文件
        fs.copyFileSync(filePath, outPath);
      }
    } else if (!skipFiles.some(ext => file.endsWith(ext))) {
      // 复制其他文件
      fs.copyFileSync(filePath, outPath);
      console.log(`📋 Copied: ${file}`);
    }
  }
}

// 主函数
function main() {
  console.log('🔧 Compiling NestJS to bytecode...');
  console.log(`📁 Source: ${distDir}`);
  console.log(`📁 Output: ${outputDir}`);
  console.log('');

  if (!fs.existsSync(distDir)) {
    console.error('❌ dist directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  // 清理输出目录
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }

  compileDirectory(distDir, outputDir);

  console.log('');
  console.log('✅ Compilation complete!');
  console.log(`📦 Output directory: ${outputDir}`);
}

main();
