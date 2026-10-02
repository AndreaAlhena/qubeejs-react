const results: { detail: string; name: string; pass: boolean }[] = [];

export function check(name: string, pass: boolean, detail: unknown = ''): void {
  results.push({
    detail: typeof detail === 'string' ? detail : JSON.stringify(detail),
    name,
    pass,
  });
}

export function finish(label: string): void {
  for (const { detail, name, pass } of results) {
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${name}${pass || !detail ? '' : `\n        got: ${detail}`}`
    );
  }

  const failed = results.filter((result) => !result.pass).length;

  console.log(`\n${label}: ${results.length - failed}/${results.length} passed`);
  process.exitCode = failed ? 1 : 0;
}
