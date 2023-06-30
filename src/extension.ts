import * as vscode from 'vscode';

var mjx: any = null;
function provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
  const mathMLRange = document.getWordRangeAtPosition(position, /<math.*<\/math>/);
  if (!mathMLRange) {
    return null;
  }

  let mathML = document.getText(mathMLRange).replace('\\"', '"');
  const stringLiteralRange = document.getWordRangeAtPosition(position, /(?<!\\)(["'`]).*(?<!\\)\1/);
  if (stringLiteralRange) {
    const l = document.getText(stringLiteralRange);
    if(l[0] === '"') { mathML = mathML.replace(/\\"/g, '"'); }
    if(l[0] === "'") { mathML = mathML.replace(/\\'/g, "'"); }
    if(l[0] === "`") { mathML = mathML.replace(/\\`/g, "`"); }
  }

  try {
    const svg = (mjx.startup.adaptor.outerHTML(mjx.mathml2svg(mathML)) as string).match(/<svg.*<\/svg>/)![0].replace('<svg style="', '<svg style="background:white;');
    const dataurl = "data:image/svg+xml," + encodeURIComponent(svg);
    const markdownString = new vscode.MarkdownString(`<img src="${dataurl}"/>`);
    markdownString.isTrusted = true;
    markdownString.supportHtml = true;
    return new vscode.Hover(markdownString);
  } catch (e) {
    return new vscode.Hover(new vscode.MarkdownString("failed to render mathML: " + String(e)));
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log("activated")
  require('mathjax').init({
    loader: {load: ['input/mml', 'output/svg']}
  }).then((mathJax:any) => {
    mjx = mathJax;
  }).catch((err:any) => console.log(err.message));

  const provider = vscode.languages.registerHoverProvider(
    { pattern: '**' }, { provideHover }
  );

  context.subscriptions.push(provider);
}

export function deactivate() {}
