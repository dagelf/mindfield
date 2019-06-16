// Board sizing and setup
rows=10 // boxes per row/col
nums=4  // number of digits

ww = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
wh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
w=Math.min(ww,rows*150) // todo compute size from cm instead of 150px
btot=rows*rows-1; bx=w/rows-2; by=bx // -margin; todo compute aspect ratio

// easier to set global css than to update each li individually
css="#game { width: "+w+"px; } li { width: "+bx+"px; height: "+by+"px; font-size: "+(bx-9)+"px; text-align: center; }";
var style=document.createElement('style'); style.type='text/css';
if(style.styleSheet){ style.styleSheet.cssText=css;}else{ style.appendChild(document.createTextNode(css)); }
document.getElementsByTagName('head')[0].appendChild(style);

// fill box array blanks and nums numbers, and then shuffle
function shuffle(a) { var j, x, i; for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); x = a[i]; a[i] = a[j]; a[j] = x }}
var box = []; for (i=1; i<=btot+1; i++) { 
  if (i<=nums) { box.push(i); } else { box.push('')};
}; shuffle(box);

// add li for each box element
output=''; for (i=0; i<=btot; i++) { 
  output += '<li>'; output += box[i]; output += '</li>';
}; document.getElementById('game').innerHTML = output;

// vanillaJS foreach
NodeList.prototype.forEach = HTMLCollection.prototype.forEach = Array.prototype.forEach;

// Initialize Plotly graphs
Plotly.newPlot('moves', [{type: 'bar',y:[1,2,3]}])
Plotly.newPlot('games', [{type: 'bar',y:[1,2,3]}]); // with option placeholders 


/*
fixme
 add persistent storiage
 add configuration interfae
 add way to skip errors and continue if possible

stats to gather:
 most commonly mistaked numbers
 correlation between time viewed and completed
 best time by mistakes
  types of mistakes
    most common numbers mistaken
    proximity
 time to recover from mistake
 accuracy
  vs number of digits
  vs number of squares
  by size of squares
  by browser
  by device 
  by type of digits
  one handed vs two handed
   number of fingers used
  by order of digits (eg for one hand or two hands, having to move your hand)
  team play
 most common first mistake
 mistakes by click speed 
 when playing same board multiple times - best score, time to get there
  
 store random seed for each game for further analysis
 causes of delays

 notes
   programming gripes to remove:
    syntax errors - good ide and runtime command line can help a lot
    keeping track of brackets - coffeescript?
*/

score=document.getElementById('score');
next=1,tlast=0,tstart=0,mistakes=0,best=10000;
tgame=[],tmove=[];

var boxes = document.querySelectorAll('li');
boxes.forEach(function (tag,n) {
// #fixme onclick if no touchscreen, but need to find workaround for firefox click delay 
  tag.addEventListener('touchstart', function (m) {
    tnow=Date.now();
	m.preventDefault();
    tag=m.currentTarget;
    x=box[n]; // x=box clickec on
    if (x!=next) {
      console.log("Wrong! You clicked ",x," instead of ",next);
      mistakes++;
      tag.style.background='red';
      boxes.forEach(function (tag,n) { tag.innerHTML=box[n] });
    } else {
      if (next==1) { tstart=tnow; };
        tag.style.background='lime';
        boxes.forEach(function (tag,n) { tag.innerHTML='' });
        next++;
        if (x==nums) {  
          tgame.push(tnow-tstart);        
//          Plotly.newPlot('games',[{type: 'bar', y: tgame}])
//          Plotly.react('games',[{type: 'histogram', x:tgame, xbins: {size:50,end:4000}}])
          score.innerHTML="Done in "+(tnow-tstart)+"ms with "+mistakes+" mistakes!<br>"+score.innerHTML;
          shuffle(box); mistakes=0;
          boxes.forEach(function (tag,n) { tag.style.background=''; tag.innerHTML=box[n] });
          next=1;
        } else {
            if (tlast>0) {         
              tmove.push(tnow-tlast);
              //  tmove.sort(function(a,b){return a-b;});
//              Plotly.newPlot('moves', [{type: 'bar', y: tmove}]); // {}, {showSendToCloud: true}]);
//              Plotly.react('moves',[{type: 'histogram',x:tmove,xbins: { size:30,end:2000 }}])
              console.log(tnow-tlast,"ms")
            };
          tlast=tnow;
        } 
    }
  })
});