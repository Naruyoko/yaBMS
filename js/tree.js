var Node=function Node(id,matrix,parent){
  if (!(this instanceof Node)) return new Node(id,matrix,parent);
  this.id=id;
  this.parent=parent;
  this.matrix=matrix+"";
  this.children=[];
  this.childrenN=0;
  this.depth=parent?parent.depth+1:0;
  this.node=Node.createDOM(this.id,this.matrix);
  Node.nodesByMatrix.set(this.matrix,this.id);
  if (Node.nodesWithMirrorsByMatrix.has(this.matrix)) Node.nodesWithMirrorsByMatrix.get(this.matrix).push(this.id);
  else Node.nodesWithMirrorsByMatrix.set(this.matrix,[this.id]);
  Node.nodes[this.id]=this;
  this.createUpdateTimeout();
}
Node.createDOM=function (id,matrix){
  var div=document.createElement('div');
  div.setAttribute("id","node"+id);
  div.setAttribute("class","node");

  var childdiv=document.createElement('div');
  childdiv.setAttribute("id","children"+id);
  childdiv.setAttribute("class","childrencontainer");
  div.appendChild(childdiv);

  var selfcontent=document.createElement('table');
  selfcontent.setAttribute("id","content"+id);
  selfcontent.setAttribute("class","nodeselfcontent");
  div.appendChild(selfcontent);

  var selfcontentrow=document.createElement('tr');
  selfcontent.appendChild(selfcontentrow);

  var bmscell=document.createElement('td');
  bmscell.setAttribute("id","bms"+id);
  bmscell.setAttribute("class","maincell")
  bmscell.innerHTML=matrix;
  selfcontentrow.appendChild(bmscell);

  var analysiscell=document.createElement('td');
  analysiscell.setAttribute("id","analysiscontainer"+id);
  analysiscell.setAttribute("class","analysiscell")
  selfcontentrow.appendChild(analysiscell);

  var analysisul=document.createElement('ul');
  analysisul.setAttribute("id","analysis"+id);
  analysisul.setAttribute("class","analysisul");
  analysisul.setAttribute("style","");
  analysiscell.appendChild(analysisul);

  var analysisoutercontainer=document.createElement('div');
  analysiscell.appendChild(analysisoutercontainer);

  var analysisinputadd=document.createElement('input');
  analysisinputadd.setAttribute("type","button");
  analysisinputadd.setAttribute("value","Add");
  analysisinputadd.setAttribute("onclick","javascript:Node.nodes["+id+"].addAnalysis();");
  analysisoutercontainer.appendChild(analysisinputadd);

  var buttonscell=document.createElement('td');
  buttonscell.setAttribute("id","buttons"+id);
  buttonscell.setAttribute("class","buttonscell");
  selfcontentrow.appendChild(buttonscell);

  if (matrix&&matrix!=Node.LEAST){
    var inputplus=document.createElement('input');
    inputplus.setAttribute("id","addbutton"+id);
    inputplus.setAttribute("type","button");
    inputplus.setAttribute("value","expand");
    inputplus.setAttribute("onclick","javascript:Node.nodes["+id+"].addChild();");
    inputplus.setAttribute("class","nodebutton");
    inputplus.setAttribute("style","");
    buttonscell.appendChild(inputplus);

    var inputminus=document.createElement('input');
    inputminus.setAttribute("id","removebutton"+id);
    inputminus.setAttribute("type","button");
    inputminus.setAttribute("value","retract");
    inputminus.setAttribute("onclick","javascript:Node.nodes["+id+"].removeChild();");
    inputminus.setAttribute("class","nodebutton unavailable");
    buttonscell.appendChild(inputminus);
  }

  if (matrix!=Node.LIMIT){
    var inputfocus=document.createElement('input');
    inputfocus.setAttribute("id","focusbutton"+id);
    inputfocus.setAttribute("type","button");
    inputfocus.setAttribute("value","focus");
    inputfocus.setAttribute("onclick","javascript:Node.toggleFocusOn(Node.nodes["+id+"])");
    inputfocus.setAttribute("class","nodebutton");
    buttonscell.appendChild(inputfocus);
  }

/*  var inputtoggleanalysis=document.createElement('input');
  inputtoggleanalysis.setAttribute("type","button");
  inputtoggleanalysis.setAttribute("value","analysis");
  inputtoggleanalysis.setAttribute("onclick","javascript:Node.nodes["+id+"].toggleAnalysis();");
  inputtoggleanalysis.setAttribute("class","nodebutton");
  buttonscell.appendChild(inputtoggleanalysis);*/

  return div;
}
Node.prototype.addChild=function (){
  if (!this.matrix||this.matrix==Node.LEAST||this.childrenN>=1&&/\(0(,0)*\)$/.test(this.matrix)) return;
  var oldtop=document.getElementById("content"+this.id).getBoundingClientRect().top;
  if (this.childrenN==this.children.length){
    var expansion=betterExpand(this.matrix,this.childrenN);
    var isStandardPath;
    if (this.matrix!=Node.LIMIT&&this.matrix!="(0)"){
      var ancestorNode=this;
      while (ancestorNode){
        if (ancestorNode.matrix==Node.LIMIT){
          isStandardPath=true;
          break;
        }
        var p=ancestorNode.parent;
        if (p&&p.children.indexOf(ancestorNode)>0&&Bms.lte(expansion,p.children[p.children.indexOf(ancestorNode)-1].matrix)){
          isStandardPath=false;
          break;
        }
        ancestorNode=p;
      }
    }else{
      isStandardPath=true;
    }
    if (isStandardPath) this.children.push(Node(Node.nodeN++,expansion,this));
    else this.children.push(Node.mirror(Node.nodeN++,expansion,this));
  }else{
    this.children[this.childrenN].createUpdateTimeout();
  }
  document.getElementById("children"+this.id).appendChild(this.children[this.childrenN].node);
  var newtop=document.getElementById("content"+this.id).getBoundingClientRect().top;
  window.scrollBy(0,newtop-oldtop);
  this.childrenN++;
  if (this.childrenN==1&&/\(0(,0)*\)$/.test(this.matrix)){
    document.getElementById("addbutton"+this.id).classList.add("unavailable");
  }
  if (this.childrenN==1){
    document.getElementById("removebutton"+this.id).classList.remove("unavailable");
  }
}
Node.prototype.removeChild=function (){
  if (this.childrenN<=0) return;
  var oldtop=document.getElementById("content"+this.id).getBoundingClientRect().top;
  this.childrenN--;
  document.getElementById("children"+this.id).removeChild(this.children[this.childrenN].node);
  var newtop=document.getElementById("content"+this.id).getBoundingClientRect().top;
  window.scrollBy(0,newtop-oldtop);
  if (this.childrenN==0&&/\(0(,0)*\)$/.test(this.matrix)){
    document.getElementById("addbutton"+this.id).classList.remove("unavailable");
  }
  if (this.childrenN==0){
    document.getElementById("removebutton"+this.id).classList.add("unavailable");
  }
}
Node.prototype.toggleAnalysis=function (){
  var analysisp=document.getElementById("analysiscontainer"+this.id);
  analysisp.setAttribute("style",analysisp.getAttribute("style")?"":"display:none");
  if (!analysisp.getAttribute("style")) this.update();
}
Node.prototype.addAnalysis=function (){
  var availableOptions=["new","cancel"];
  var data=analysisData.get(this.matrix);
  for (var i=0;i<notations.length;i++){
    if (!data||data[notations[i]]===undefined||data[notations[i]]===null){
      availableOptions.push(notations[i]);
    }
  }
  var selection;
  do{
    selection=prompt(availableOptions.join(", "));
    if (selection===null) return;
  }while (availableOptions.indexOf(selection)==-1);
  if (selection=="cancel") return;
  if (selection=="new"){
    var newNotation;
    do{
      newNotation=prompt("The name of the new notation?");
      if (newNotation===null) return;
    }while(!newNotation||notations.indexOf(newNotation)!=-1);
    if (newNotation=="cancel") return;
    selection=newNotation;
    notations.push(selection);
  }
  if (!data){
    data={};
    analysisData.set(this.matrix,data);
  }
  data[selection]=prompt("Value?","")||"";
  this.updateAll();
}
Node.prototype.editAnalysis=function (notationid){
  var data=analysisData.get(this.matrix);
  var newValue=prompt("Editing analysis for "+notations[notationid],data[notations[notationid]]);
  if (newValue===null) return;
  data[notations[notationid]]=newValue;
  this.updateAll();
}
Node.prototype.removeAnalysis=function (notationid){
  if (!confirm("Are you sure?")) return;
  var data=analysisData.get(this.matrix);
  data[notations[notationid]]=null;
  for (var i=0;i<notations.length;i++){
    if (data[notations[i]]!==undefined||data[notations[i]]!==null) break;
  }
  if (i==notations.length) analysisData.remove(this.matrix);
  this.updateAll();
}
Node.prototype.update=function (){
  var analysisp=document.getElementById("analysis"+this.id);
  if (!analysisp) this.createUpdateTimeout();
  analysisp.innerHTML="";
  var data=analysisData.get(this.matrix);
  if (data){
    for (var i=0;i<notations.length;i++){
      if (data[notations[i]]===undefined||data[notations[i]]===null) continue;
      var item=document.createElement('li');
      analysisp.appendChild(item);
      var itemcontent=document.createElement('span');
      itemcontent.textContent=notations[i]+" - "+data[notations[i]];
      itemcontent.setAttribute("class","analysiscontent");
      item.appendChild(itemcontent);
      var iteminputedit=document.createElement('input');
      iteminputedit.setAttribute("type","button");
      iteminputedit.setAttribute("value","Edit");
      iteminputedit.setAttribute("onclick","javascript:Node.nodes["+this.id+"].editAnalysis("+i+");");
      item.appendChild(iteminputedit);
      var iteminputremove=document.createElement('input');
      iteminputremove.setAttribute("type","button");
      iteminputremove.setAttribute("value","Remove");
      iteminputremove.setAttribute("onclick","javascript:Node.nodes["+this.id+"].removeAnalysis("+i+");");
      item.appendChild(iteminputremove);
    }
  }
}
Node.prototype.createUpdateTimeout=function (time){
  if (time===undefined) time=50;
  setTimeout(function(){this.update();}.bind(this),time);
}
Node.prototype.updateAll=function (){
  var ids=Node.nodesWithMirrorsByMatrix.get(this.matrix);
  for (var i=0;i<ids.length;i++){
    var node=Node.nodes[ids[i]];
    if (node.node.offsetParent!==null) node.update();
  }
}
Node.updateAll=function (){
  for (var i=0;i<Node.nodes.length;i++){
    var node=Node.nodes[i];
    if (node.node.offsetParent!==null) node.update();
  }
}
Node.mirror=function (id,matrix,parent){
  if (!(this instanceof Node.mirror)) return new Node.mirror(id,matrix,parent);
  this.id=id;
  this.parent=this.parent;
  this.matrix=matrix+"";
  this.depth=parent?parent.depth+1:0;
  this.node=Node.mirror.createDOM(this.id,this.matrix);
  if (Node.nodesWithMirrorsByMatrix.has(this.matrix)) Node.nodesWithMirrorsByMatrix.get(this.matrix).push(this.id);
  else Node.nodesWithMirrorsByMatrix.set(this.matrix,[this.id]);
  Node.nodes[this.id]=this;
  this.createUpdateTimeout();
}
Node.mirror.createDOM=function (id,matrix){
  var div=document.createElement('div');
  div.setAttribute("id","node"+id);
  div.setAttribute("class","node");

  var childdiv=document.createElement('div');
  childdiv.setAttribute("id","children"+id);
  childdiv.setAttribute("class","childrencontainer");
  div.appendChild(childdiv);

  var selfcontent=document.createElement('table');
  selfcontent.setAttribute("id","content"+id);
  selfcontent.setAttribute("class","nodeselfcontent");
  div.appendChild(selfcontent);

  var selfcontentrow=document.createElement('tr');
  selfcontent.appendChild(selfcontentrow);

  var bmscell=document.createElement('td');
  bmscell.setAttribute("id","bms"+id);
  bmscell.setAttribute("class","maincell")
  bmscell.innerHTML=matrix;
  selfcontentrow.appendChild(bmscell);

  var analysiscell=document.createElement('td');
  analysiscell.setAttribute("id","analysiscontainer"+id);
  analysiscell.setAttribute("class","analysiscell")
  selfcontentrow.appendChild(analysiscell);

  var analysisul=document.createElement('ul');
  analysisul.setAttribute("id","analysis"+id);
  analysisul.setAttribute("class","analysisul");
  analysisul.setAttribute("style","");
  analysiscell.appendChild(analysisul);

  var analysisoutercontainer=document.createElement('div');
  analysiscell.appendChild(analysisoutercontainer);

  var buttonscell=document.createElement('td');
  buttonscell.setAttribute("id","buttons"+id);
  buttonscell.setAttribute("class","buttonscell");
  selfcontentrow.appendChild(buttonscell);

  var inputscroll=document.createElement('input');
  inputscroll.setAttribute("type","button");
  inputscroll.setAttribute("value","go to original");
  inputscroll.setAttribute("onclick","javascript:searchByMatrix(\""+matrix+"\");");
  inputscroll.setAttribute("class","nodebutton");
  buttonscell.appendChild(inputscroll);

/*  var inputtoggleanalysis=document.createElement('input');
  inputtoggleanalysis.setAttribute("type","button");
  inputtoggleanalysis.setAttribute("value","analysis");
  inputtoggleanalysis.setAttribute("onclick","javascript:Node.nodes["+id+"].toggleAnalysis();");
  inputtoggleanalysis.setAttribute("class","nodebutton");
  buttonscell.appendChild(inputtoggleanalysis);*/

  return div;
}
Node.mirror.prototype.update=function (){
  var analysisp=document.getElementById("analysis"+this.id);
  if (!analysisp) this.createUpdateTimeout();
  analysisp.innerHTML="";
  var data=analysisData.get(this.matrix);
  if (data){
    for (var i=0;i<notations.length;i++){
      if (data[notations[i]]===undefined||data[notations[i]]===null) continue;
      var item=document.createElement('li');
      analysisp.appendChild(item);
      var itemcontent=document.createElement('span');
      itemcontent.textContent=notations[i]+" - "+data[notations[i]];
      itemcontent.setAttribute("class","analysiscontent");
      item.appendChild(itemcontent);
    }
  }
}
Node.mirror.prototype.createUpdateTimeout=function (time){
  if (time===undefined) time=50;
  setTimeout(function(){this.update();}.bind(this),time);
}
Node.mirror.prototype.toggleAnalysis=Node.prototype.toggleAnalysis;
Node.nodes=[];
Node.nodesByMatrix=new Map();
Node.nodesWithMirrorsByMatrix=new Map();
Node.getNodeByMatrix=function (matrix){
  var nodeid=Node.nodesByMatrix.get(matrix);
  return nodeid===undefined?null:Node.nodes[nodeid];
}
Node.getNodesWithMirrorsByMatrix=function (matrix){
  var nodeids=Node.nodesWithMirrorsByMatrix.get(matrix);
  var r=[];
  for (var i=0;i<nodeids.length;i++){
    r.push(Node.nodes[nodeids[i]]);
  }
  return r;
}
Node.nodeN=0;
Node.LEAST="\u03b5";
Node.LIMIT="limit";
Node.limitNode=null;
Node.root=null;
Node.setroot=function (node){
  if (!node) node=Node.limitNode;
  Node.root=node;
  treecontainer.innerHTML="";
  treecontainer.appendChild(node.node);
}
Node.toggleFocusOn=function (node){
  var oldtop=node.node.getBoundingClientRect().top;
  var oldroot=Node.root;
  var newroot=node==oldroot?Node.limitNode:node;
  Node.setroot(Node.limitNode);
  if (oldroot.parent){
    var parentDOM=document.getElementById("children"+oldroot.parent.id);
    parentDOM.insertBefore(oldroot.node,parentDOM.children[oldroot.parent.children.indexOf(oldroot)+1]);
  }
  if (oldroot!=Node.limitNode) document.getElementById("focusbutton"+oldroot.id).setAttribute("value","focus");
  if (newroot!=Node.limitNode) Node.setroot(newroot);
  if (newroot!=Node.limitNode) document.getElementById("focusbutton"+newroot.id).setAttribute("value","unfocus");
  var newtop=node.node.getBoundingClientRect().top;
  window.scrollBy(0,newtop-oldtop);
}

var expansionCache={};
var betterExpand=function (matrix,n){
  var pairid=matrix+n;
  if (expansionCache[pairid]!==undefined) return expansionCache[pairid];
  var expansion;
  if (matrix==Node.LEAST){
    expansion=Node.LEAST;
  }else if (matrix==Node.LIMIT){
    expansion=n==0?"(0)(1)":"("+"0,".repeat(n)+"0)("+"1,".repeat(n)+"1)";
  }else if (matrix=="(0)"){
    expansion=Node.LEAST;
  }else{
    var b=new Bms(matrix);
    b.b=n;
    expansion=b.expand().toStringWithEmptyRowRemoved().split("[")[0];
  }
  expansionCache[pairid]=expansion;
  return expansion;
}
var indexFromMatrix=function (matrix){
  var path;
  if (matrix==Node.LEAST){
    path=[0,0,0];
  }else if (matrix==Node.LIMIT){
    path=[];
  }else if (/^\(0(,0)*\)\(1(,1)*\)$/.test(matrix)){
    path=[matrix.split("(")[2].length/2-1];
  }else if (/^(\(\d+(,\d+)*\))+$/.test(matrix)){
    var lastMatrix=Node.LIMIT;
    path=[];
    while (true){
      var expansion;
      var n=0;
      while (true){
        expansion=betterExpand(lastMatrix,n);
        if (Bms.lte(matrix,expansion)) break;
        if (new Bms(matrix).Lng()<=new Bms(expansion).Lng()){
          console.warn("Nonstandard matrix: "+matrix);
          return null;
        }
        n++;
      }
      path.push(n);
      lastMatrix=expansion;
      if (Bms.eq(matrix,expansion)) break;
    }
  }else{
    console.error("Unable to parse matrix: "+matrix);
  }
  return path;
}
var searchByMatrix=function (matrix){
  if (matrix===undefined) matrix=document.getElementById("searchByMatrixInput").value;
  if (!matrix) matrix=Node.LEAST;
  var path=indexFromMatrix(matrix);
  if (path) searchByIndex(path);
}
var searchByIndex=function (index){
  if (index===undefined) index=document.getElementById("searchByIndexInput").value;
  if (typeof index=="string"&&!/^(|\d(,\d)*)$/.test(index)) return;
  if (typeof index=="string") index=index.split(",");
  var lastNode=Node.limitNode;
  for (var i=0;i<index.length;i++){
    var expectedChildrenN=lastNode.childrenN;
    while (expectedChildrenN<=index[i]){
      lastNode.addChild();
      expectedChildrenN++;
    }
    if (!lastNode.children[index[i]]){
      console.error("Invalid index");
      return;
    }
    lastNode=lastNode.children[index[i]];
  }
  lastNode.node.scrollIntoView();
  highlightNode(document.getElementById("content"+lastNode.id));
}
var highlightNode=function (node,time){
  if (!node) return;
  if (time===undefined) time=800;
  node.classList.add("highlighted");
  setTimeout(function(){node.classList.remove("highlighted")},time);
}

var uploadFile=function (checkStandard){
  if (analysisData.size>0&&!confirm("Uploading analysis overwrites the existing data. Are you sure you want to do that?")) return;
  var fileInput=document.getElementById("uploadFile");
  var fileExtention=fileInput.value.slice(fileInput.value.lastIndexOf(".")+1);
  var reader=new FileReader();
  if (fileExtention=="xls"||fileExtention=="xlsx"){
    var reader=new FileReader();
    reader.onload=function (e){
      loadAnalysisFromXLS(e.target.result,checkStandard);
    }
    reader.readAsBinaryString(fileInput.files[0]);
  }
}
var loadAnalysisFromXLS=function(fileData,checkStandard){
  var workbook=XLSX.read(fileData,{type:"binary"});
  var sheetNames=workbook.SheetNames;
  var sheetsInOrder=[];
  var firstHeaderOccurences={};
  var firstHeaders=[];
  for (var i=0;i<sheetNames.length;i++){
    sheetsInOrder.push(workbook.Sheets[sheetNames[i]]);
    var firstHeader=workbook.Sheets[sheetNames[i]]["A1"].v;
    if (firstHeaders.indexOf(firstHeader)==-1){
      firstHeaderOccurences[firstHeader]=1;
      firstHeaders.push(firstHeader);
    }else{
      firstHeaderOccurences[firstHeader]++;
    }
  }
  var mostCommonFirstHeader="";
  var mostCommonFirstHeaderOccurences=0;
  for (var i=0;i<firstHeaders.length;i++){
    if (firstHeaderOccurences[firstHeaders[i]]>mostCommonFirstHeaderOccurences){
      mostCommonFirstHeader=firstHeaders[i];
      mostCommonFirstHeaderOccurences=firstHeaderOccurences[firstHeaders[i]];
    }
  }
  var mainColName=prompt("Column for main notation?",mostCommonFirstHeader);
  if (mainColName===null) return;
  analysisData=new Map();
  notations=[];
  for (var i=0;i<sheetsInOrder.length;i++){
    console.log("Working on: "+sheetNames[i]);
    var sheet=sheetsInOrder[i];
    var sheetKeys=Object.keys(sheet);
    var mainCol;
    var headers={};
    var notationCols=[];
    for (var j=0;j<sheetKeys.length&&/^[A-Z]+1$/.test(sheetKeys[j]);j++){
      var col=sheetKeys[j].slice(0,-1);
      if (sheet[sheetKeys[j]].v==mainColName||mainColName=="ForceA"&&col=="A") mainCol=col;
      else notationCols.push(col);
      headers[col]=sheet[sheetKeys[j]].v;
    }
    if (!mainCol) continue;
    var maxRow=+sheet["!ref"].split(":")[1].replace(/[A-Z]/g,"");
    for (var row=2;row<=maxRow;row++){
      var matrixCell=sheet[mainCol+row];
      if (!matrixCell) continue;
      var matrix=matrixCell.v;
      if (matrix.toLowerCase().indexOf("empty")!=-1) matrix=Node.LEAST;
      while (matrix[matrix.length-1]==" ") matrix=matrix.slice(0,-1);
      var data=analysisData.get(matrix);
      if (data){
        console.warn("Duplicate column: "+matrix);
      }
      if (checkStandard){
        if (!indexFromMatrix(matrix)){
          console.log("Nonstandard matrix found at '"+sheetNames[i]+"'!"+mainCol+row);
        }
      }
      for (var j=0;j<notationCols.length;j++){
        var analysisCell=sheet[notationCols[j]+row];
        if (!analysisCell) continue;
        var analysis=analysisCell.v;
        if (!analysis) continue;
        if (notations.indexOf(headers[notationCols[j]])==-1) notations.push(headers[notationCols[j]]);
        if (!data){
          data={};
          analysisData.set(matrix,data);
        }
        data[headers[notationCols[j]]]=analysis;
      }
    }
  }
  console.log("Data loaded");
  Node.updateAll();
  console.log("Load complete");
}
var renameNotation=function(index,newname,force){
  if (!force&&notations.indexOf(newname)!=-1){
    console.error("Notation "+newname+" is already found.");
    return;
  }
  if (index<0||index>=notations.length) throw Error("Index error.");
  var oldname=notations[index];
  if (notations.indexOf(newname)==-1){
    notations.splice(index,1,newname);
  }else{
    notations.splice(index,1);
  }
  var analysisKeys=Array.from(analysisData.keys());
  for (var i=0;i<analysisKeys.length;i++){
    var matrix=analysisKeys[i];
    var data=analysisData.get(matrix);
    if (data[oldname]!==undefined&&data[oldname]!==null){
      data[newname]=data[oldname];
      data[oldname]=null;
    }
  }
  Node.updateAll();
}

var notations=[];
var analysisData=new Map();

var treecontainer;
var rightsidecontent,rightsidecontainer;
var toggleRightsideMenu=function (){
  rightsidecontent.style.display=rightsidecontent.style.display?"":"none";
}
window.onload=function (){
  treecontainer=document.getElementById("treecontainer");
  Node.setroot(Node.limitNode=Node(Node.nodeN++,Node.LIMIT,null));
  treecontainer.appendChild(Node.root.node);
  rightsidecontainer=document.getElementById("rightsidecontainer");
  rightsidecontent=document.getElementById("rightsidecontent");
  toggleRightsideMenu();
  window.addEventListener("scroll",function(){rightsidecontainer.style.top=(window.pageYOffset||document.documentElement.scrollTop)+"px";});
}