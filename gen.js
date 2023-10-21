import {fetchFile,nodefs, patchBuf, readTextContent, readTextLines, writeChanged} from 'ptk/nodebundle.cjs'
import {FetchId} from './src/fetchid.js'
import {Errata} from './src/errata.js'
await nodefs;
const srcdir='html/';
const outdir='off/';
const allsutras='t262,t263,t264,en,sd'.split(',')
const sutras=(process.argv[2]||'t262,t263,t264,en,sd').split(',');

let  contentid='';
const idmap=[]
let hasidarr=false,idarr=[];
const idarrs={}

const replaceId=line=>{
    return line.replace(/@([a-zA-Z_\-\d]+)/g,(m,m1)=>{
        const id=m1.replace('T0','T');
        let  at=id.indexOf('-');
        if (!~at) at=id.indexOf('D');
        const sutra=id.slice(0,at);

        if (!idarrs[sutra]) {
            // console.log('unknown id',m1,sutra)
            return '';
        }
        
        const idx=idarrs[sutra].indexOf(m1);
        // if (~idx) {
        //     return '\t@'+sutra+'-'+idx;
        // } else {
            return '\t@'+m1+'('+idx+')';
        // }
        
    })
}
const parseFile=fn=>{
    
    let content=readTextContent(srcdir+fn+'.html')
    const errata=Errata[fn];
    if (errata) {
        content=patchBuf(content,errata,fn);
    }
    let at=content.indexOf('<hr>')
    if (~at) content=content.slice(at+4);

    at=content.indexOf('<body>')
    if (~at) content=content.slice(at+6);

    at=content.indexOf('</body>');
    if (~at) content=content.slice(0,at);


    content = content.replace(/([a-z]+)=\n/g,(m,m1)=>m1+'=') //有些 attribute 被\n 斷開
    //remove line marker
    content=content.replace(/ ?<a name="[\-\da-d]+" class="[ a-z_\d]+" id="[\-\da-d]+">\[[\-\da-d]+\]<\/a>/g,'')
    //content id
    content=content.replace(/<span class="HL_Tag" name="([a-zA-Z,\d_\-]+)">([^<]+?)<\/span>/g,(m,id,lbl)=>{
        return '^hl('+lbl+')';
    })
    //content id
    content=content.replace(/<div class="content" id="([a-zA-Z\d_\-]+)">/g,(m,m1)=>{
        return '\n^ck#'+m1+' ';
    })
   //內文, 冊頁碼
    content=content.replace(/<p class="normal" id="([a-zA-Z\d_\-]+)">/g,(m,m1)=>{
        return '\n^p#'+m1+' ';
    })
    content=content.replace(/<\/p>/g,'')
    //異體字 app 不要

    //app
    content=content.replace(/ ?<span class="app">([^<]*)<\/span> ?/g,(m,lbl)=>{
        return lbl;
    }) 

    //term
    content=content.replace(/<span class="term">([^<]*)<\/span>/g,(m,lbl)=>{
        return '^w('+lbl+')';
    }) 

    //app
    content=content.replace(/<span class="app">([^<]*)<\/span>/g,(m,lbl)=>{
        return lbl;
    }) 


    content=content.replace(/<table class="lg_table">/g,()=>{
        return '^lg';
    })
    content=content.replace(/<\/table>\n/g,()=>{
        return '';
    })
    content=content.replace(/<div class="head">\n?/g,'')
    
    content=content.replace(/<div class="juanDesc">\n?/g,'')
    content=content.replace(/<div class="subHtml">\n/g,'')
    content=content.replace(/<div class="byline">\n?/g,'')
    content=content.replace(/<\/div>\n/g,'')
    content=content.replace(/<br class="lg_br">/g,'')
    content=content.replace(/<div>/g,'')
    content=content.replace(/<tr>/g,'')
    content=content.replace(/<\/tr>/g,'')
    content=content.replace(/<td>/g,'')
    content=content.replace(/<\/td>/g,'')


    

    content=content.replace(/<div class="head_title">/g,'^h');
    content=content.replace(/<a +class="link2oth" +id="([a-zA-Z\d_\-]+)">([^<]+?)<\/a>/g,(m,id,lbl)=>{
        return '@'+id;
    })

    content=content.replace(/<a +class="link2oth" +id="([a-zA-Z\d_\-]+)" name="[a-zA-Z\d_\-]+">([^<]+?)<\/a>/g,(m,id,lbl)=>{
        return '@'+id;
    })

    const lines=content.split(/\n+/);

    for (let i=0;i<lines.length;i++) {
        const line=lines[i];
        const at=line.indexOf('^ck');
        if (~at) {
            contentid=line.slice(at+4)+' ';
        }
        if (~line.indexOf('@')) {
            if (!contentid) {
                //missing id
                if (fn=='t263-1') contentid='T0263D01_001';
                else if (fn=='t264-1') contentid='T0264D01_001';
            }
            if (!contentid) throw "no content id"
            const m=lines[i].match(/\^h【([^】]+)/);
            if (!m) {
                console.log(lines[i])
            }
            if (hasidarr) {
                const l=replaceId(lines[i]);
                idmap.push(contentid+'\t'+l);
            } else {
                idarr.push(contentid.trim());
            }
            

            lines[i]='';
        }
    }
    return lines.join('\n');
}


for (let i=0;i<allsutras.length;i++) {
    const sutra=allsutras[i];
    const idfn=outdir+sutra+'.txt';
    
    if (fs.existsSync(idfn)){
        hasidarr=true;
        idarrs[sutra.toUpperCase()]=readTextLines(idfn);
        
    }
}

for (let i=0;i<sutras.length;i++) {
    const sutra=sutras[i];
    const sutraidarr=FetchId[sutra];
    idmap.length=0;
    const idfn=outdir+sutra+'.txt';
    idarr.length=0;

    if (idarrs[sutra]){
        hasidarr=true;   
    }
    if (sutraidarr) {
        const out=[];
        sutraidarr.forEach(it=>out.push(parseFile(it[1])));
        writeChanged(outdir+sutra+'.off',out.join('\n'),true)
        if (idmap.length) writeChanged(outdir+sutra+'.tsv',idmap.join('\n'),true)
        if (idarr.length) writeChanged(idfn,idarr.join('\n'),true)
    } else {
        console.log('invalid id',sutra)
    }
}