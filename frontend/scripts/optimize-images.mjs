/**
 * Image Optimization Script
 * Compresses and converts images to WebP format for better performance
 * Run with: node scripts/optimize-images.mjs
 */

import sharp from 'sharp';
import { readdir, mkdir, stat } from 'fs/promises';
import { join, parse, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ASSETS_DIR = join(__dirname, '..', 'src', 'assets');
const OUTPUT_DIR = join(__dirname, '..', 'src', 'assets-optimized');

// Target sizes for different image types
const IMAGE_CONFIGS = {
  // Product images - displayed at max ~400px wide
  product: { width: 800, quality: 85 },
  // Hero images - full width but optimized
  hero: { width: 1920, quality: 80 },
};

async function getFilesRecursively(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await getFilesRecursively(fullPath, files);
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function optimizeImage(inputPath, outputPath, config) {
  const { width, quality } = config;
  
  try {
    await sharp(inputPath)
      .resize(width, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality })
      .toFile(outputPath);
    
    const inputStats = await stat(inputPath);
    const outputStats = await stat(outputPath);
    const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
    
    console.log(`✅ ${parse(inputPath).base}`);
    console.log(`   ${(inputStats.size / 1024 / 1024).toFixed(2)} MB → ${(outputStats.size / 1024).toFixed(0)} KB (${savings}% smaller)`);
    
    return { input: inputStats.size, output: outputStats.size };
  } catch (error) {
    console.error(`❌ Failed to optimize ${inputPath}:`, error.message);
    return { input: 0, output: 0 };
  }
}

async function main() {
  console.log('🖼️  Image Optimization Script\n');
  console.log('Input:', ASSETS_DIR);
  console.log('Output:', OUTPUT_DIR);
  console.log('');
  
  // Create output directory structure
  await mkdir(OUTPUT_DIR, { recursive: true });
  
  const subDirs = ['cookies', 'cupcakes', 'cakepops'];
  for (const dir of subDirs) {
    await mkdir(join(OUTPUT_DIR, dir), { recursive: true });
  }
  
  // Get all image files
  const files = await getFilesRecursively(ASSETS_DIR);
  console.log(`Found ${files.length} images to optimize\n`);
  
  let totalInput = 0;
  let totalOutput = 0;
  
  for (const inputPath of files) {
    // Determine config based on file location
    const relativePath = relative(ASSETS_DIR, inputPath);
    const isHero = inputPath.includes('hero');
    const config = isHero ? IMAGE_CONFIGS.hero : IMAGE_CONFIGS.product;
    
    // Create output path with .webp extension
    const parsed = parse(relativePath);
    const outputRelative = join(parsed.dir, `${parsed.name}.webp`);
    const outputPath = join(OUTPUT_DIR, outputRelative);
    
    // Ensure output directory exists
    await mkdir(dirname(outputPath), { recursive: true });
    
    const stats = await optimizeImage(inputPath, outputPath, config);
    totalInput += stats.input;
    totalOutput += stats.output;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   Total input:  ${(totalInput / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total output: ${(totalOutput / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Saved: ${((1 - totalOutput / totalInput) * 100).toFixed(1)}%`);
  console.log('\n⚠️  Next steps:');
  console.log('   1. Review optimized images in src/assets-optimized/');
  console.log('   2. If quality is acceptable, replace src/assets/ contents');
  console.log('   3. Update imports in products.ts to use .webp extension');
}

main().catch(console.error);
