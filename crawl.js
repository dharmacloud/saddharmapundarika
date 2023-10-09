import {fetchFile,nodefs} from 'ptk/nodebundle.cjs'
await nodefs;

const prefix='http://sdp.chibs.edu.tw/exeQuery.php?getHtml=yes&id=';
const outdir='html/'

const idarr=[
    ['EN-KND11_038','en-1'],
    ['EN-KND10_059','en-2'],
    ['EN-KND07_060','en-3'],
    ['EN-KND07_141','en-4'],
    ['EN-KND04_033','en-5'],
    
] 

const fetchfile=async ([fn,outname])=>{
    const content=await fetchFile(prefix+fn, outdir+outname+'.html');
    console.log(fn,content.length)
}

idarr.map(fetchfile)