'use strict';
const qs=s=>document.querySelector(s);
const qsa=s=>[...document.querySelectorAll(s)];
const storageKey='milulab-dify-public-health-progress-v1';
let completed=new Set();
try{const value=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(value))completed=new Set(value.filter(x=>typeof x==='string'));}catch{}
let route='ai';
let timer;
function message(text){qs('#toast').textContent=text;qs('#toast').classList.add('show');clearTimeout(timer);timer=setTimeout(()=>qs('#toast').classList.remove('show'),2600);}
function updateProgress(){
 const steps=qsa('.step').filter(x=>getComputedStyle(x).display!=='none');
 const count=steps.filter(x=>completed.has(x.id)).length;
 steps.forEach((step,index)=>{const next=step.querySelector('.completion a');if(next)next.href='#'+(steps[index+1]?.id||'verify');});
 qs('#progress-text').textContent=`手动勾选进度：${count} / ${steps.length} 步`;
 qs('#progress-bar').max=steps.length;qs('#progress-bar').value=count;
 qsa('[data-complete]').forEach(b=>{const done=completed.has(b.dataset.complete);b.setAttribute('aria-pressed',String(done));b.textContent=done?'已标记完成 ✓':'我已完成这一步';});
 qsa('.toc a').forEach(a=>a.classList.toggle('done',completed.has(a.hash.slice(1))));
}
function chooseRoute(value){route=value;document.body.classList.toggle('mode-core',route==='core');document.body.classList.toggle('mode-ai',route==='ai');qsa('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.route===route)));qs('#route-note').textContent=route==='core'?'免模型路线：先建8个节点，事实报告直接连成功输出；无需模型密钥。':'AI解读路线：共10个节点；统计代码先算出事实，LLM随后解释，最后合并输出。';updateProgress();}
function chooseEnvironment(value){
 const local=value==='local';
 qsa('[data-environment]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.environment===value)));
 qsa('[data-environment-panel]').forEach(p=>{p.hidden=p.dataset.environmentPanel!==value;});
 qsa('[data-studio-link]').forEach(a=>{a.href=local?'http://localhost:8080/apps':'https://cloud.dify.ai/apps';});
 qs('#environment-note').textContent=local?'当前选择：本地安装。下方工作室链接使用本教程的8080端口；若你改了端口，请使用自己的实际地址。':'当前选择：线上云端。下方“进入工作室”链接将打开Dify Cloud。';
}
async function copyText(text,element){try{await navigator.clipboard.writeText(text);message('已复制完整内容');}catch{if(element){const range=document.createRange();range.selectNodeContents(element);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);message('请按 Ctrl/Cmd + C 复制已选内容');}else{message('复制未完成，请长按或手动选中链接');}}}
document.addEventListener('click',e=>{
 const copy=e.target.closest('[data-copy]');if(copy){e.preventDefault();const source=document.getElementById(copy.dataset.copy);copyText(source.textContent,source);}
 const url=e.target.closest('[data-url]');if(url){const source=document.getElementById(url.dataset.url);copyText(source.href,source);}
 const expand=e.target.closest('[data-expand]');if(expand){const block=document.getElementById(expand.dataset.expand);const open=block.classList.toggle('expanded');expand.setAttribute('aria-expanded',String(open));expand.textContent=open?'收起':'展开全部';}
 const done=e.target.closest('[data-complete]');if(done){completed.has(done.dataset.complete)?completed.delete(done.dataset.complete):completed.add(done.dataset.complete);try{localStorage.setItem(storageKey,JSON.stringify([...completed]));}catch{}updateProgress();}
 const b=e.target.closest('[data-route]');if(b)chooseRoute(b.dataset.route);
 const environment=e.target.closest('[data-environment]');if(environment)chooseEnvironment(environment.dataset.environment);
});
qs('#reset-progress').addEventListener('click',()=>{completed.clear();try{localStorage.removeItem(storageKey);}catch{}updateProgress();message('已清空本机的手动进度');});
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{const item=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];if(item){qsa('.toc a').forEach(a=>{const active=a.hash==='#'+item.target.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}},{rootMargin:'-110px 0px -45% 0px',threshold:0});qsa('.step').forEach(s=>observer.observe(s));}
chooseRoute('ai');
chooseEnvironment(location.hash==='#local-install'?'local':'cloud');
