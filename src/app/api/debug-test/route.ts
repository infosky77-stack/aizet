import { NextResponse } from 'next/server';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cwd = process.cwd();
  const testPath = join(cwd, 'data', 'debug-test.txt');
  let writeResult = 'not attempted';
  
  console.log('[debug-test] cwd:', cwd);
  console.log('[debug-test] testPath:', testPath);
  
  try {
    mkdirSync(join(cwd, 'data'), { recursive: true });
    writeFileSync(testPath, `test at ${new Date().toISOString()}\n`, 'utf-8');
    writeResult = 'success';
    console.log('[debug-test] write success');
  } catch (err) {
    writeResult = `error: ${err}`;
    console.error('[debug-test] write error:', err);
  }
  
  return NextResponse.json({ cwd, testPath, writeResult });
}
