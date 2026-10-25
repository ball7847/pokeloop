import React,{useState,useRef} from 'react';
import {encodeSave,decodeSave} from '../core/saveSystem.js';
import {useGameStore} from '../store/useGameStore.js';
export function SettingsPage(){
  return <><div className="intro"><span>OPTIONS</span><h2>설정</h2><p>저장 데이터를 관리합니다.</p></div>
    <SaveSettings/>
  </>;
}
function SaveSettings(){
  const autoSaveEnabled=useGameStore(s=>s.autoSaveEnabled);
  const lastSavedAt=useGameStore(s=>s.lastSavedAt);
  const saveError=useGameStore(s=>s.saveError);
  const [feedback,setFeedback]=useState('');
  const [pasteOpen,setPasteOpen]=useState(false);
  const [pasteText,setPasteText]=useState('');
  const fileRef=useRef(null);
  const notify=(action,success)=>{
    try{success(action());}catch(error){setFeedback('오류: '+error.message);}
  };
  const importEncoded=encoded=>notify(()=>decodeSave(encoded),({game,savedAt})=>{
    if(!window.confirm('현재 진행 상황을 불러온 데이터로 덮어쓸까요?'))return;
    const elapsed=game.phase==='running'?Math.max(0,(Date.now()-Date.parse(savedAt))/1000):0;
    useGameStore.getState().importGame({...game,pendingOfflineSeconds:(game.pendingOfflineSeconds??0)+elapsed});
    setPasteOpen(false);setPasteText('');setFeedback('저장 데이터를 불러오고 로컬에 저장했습니다.');
  });
  const exportEncoded=()=>{
    const {game,offlineRemainingSeconds}=useGameStore.getState();
    return encodeSave({...game,pendingOfflineSeconds:offlineRemainingSeconds});
  };
  const saveFile=()=>notify(exportEncoded,encoded=>{
    const blob=new Blob([encoded+'\n'],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download='pokeloop-save-'+new Date().toISOString().slice(0,10)+'.txt';
    document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
    setFeedback('TXT 파일로 저장했습니다.');
  });
  const copySave=async()=>{
    try{await navigator.clipboard.writeText(exportEncoded());setFeedback('클립보드에 Base64 저장 데이터를 복사했습니다.');}
    catch(e){setFeedback('클립보드 복사가 차단되었습니다: '+e.message);}
  };
  const pasteSave=async()=>{
    try{importEncoded(await navigator.clipboard.readText());}
    catch{setPasteOpen(true);setFeedback('클립보드 접근이 제한되었습니다. 아래 입력란에 붙여넣으세요.');}
  };
  const readFile=async(event)=>{
    const file=event.target.files?.[0];event.target.value='';
    if(!file)return;
    if(file.size>1000000){setFeedback('오류: 저장 파일이 너무 큽니다.');return;}
    try{importEncoded(await file.text());}
    catch(e){setFeedback('오류: '+e.message);}
  };
  const reset=()=>{
    if(!window.confirm('모든 로컬 저장 데이터를 삭제하고 게임 진행 상황을 초기화할까요? 이 작업은 되돌릴 수 없습니다.'))return;
    notify(()=>useGameStore.getState().resetSavedGame(),()=>{
      setPasteOpen(false);setPasteText('');setFeedback('로컬 데이터를 삭제하고 게임을 초기화했습니다.');
    });
  };
  return <section className="panel save-panel" aria-label="저장 관리">
    <h3>저장 관리</h3>
    <div className="save-last"><small>최근 로컬 저장 시점</small><strong>{lastSavedAt?new Date(lastSavedAt).toLocaleString('ko-KR'):'저장 기록 없음'}</strong></div>
    <div className="save-toggle"><span>자동 저장 <small>30초마다 로컬에 저장</small></span>
      <button type="button" aria-pressed={autoSaveEnabled} onClick={()=>notify(()=>useGameStore.getState().setAutoSaveEnabled(!autoSaveEnabled),()=>setFeedback('자동 저장 '+(!autoSaveEnabled?'ON':'OFF')))}>
        {autoSaveEnabled?'자동 저장 ON':'자동 저장 OFF'}
      </button>
    </div>
    <div className="save-actions">
      <button type="button" onClick={()=>notify(()=>useGameStore.getState().saveLocal(),()=>setFeedback('로컬에 저장했습니다.'))}>로컬 저장</button>
      <button type="button" className="save-danger" onClick={reset}>초기화</button>
      <button type="button" onClick={saveFile}>파일로 저장</button>
      <button type="button" onClick={copySave}>클립보드로 저장</button>
      <button type="button" onClick={()=>fileRef.current?.click()}>파일로 불러오기</button>
      <button type="button" onClick={pasteSave}>클립보드로 불러오기</button>
    </div>
    <input ref={fileRef} type="file" accept=".txt,text/plain" hidden onChange={readFile} aria-label="저장 파일 선택"/>
    {pasteOpen&&<div className="save-paste"><label htmlFor="save-paste-text">Base64 저장 문자열 붙여넣기</label>
      <textarea id="save-paste-text" value={pasteText} onChange={e=>setPasteText(e.target.value)} rows={4}/>
      <button type="button" onClick={()=>importEncoded(pasteText)}>붙여넣은 데이터 불러오기</button>
    </div>}
    {(feedback||saveError)&&<p className="save-feedback" role="status">{feedback||saveError}</p>}
  </section>;
}
