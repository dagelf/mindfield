function shuffle(a) { var j, x, i; for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); x = a[i]; a[i] = a[j]; a[j] = x }}
var box = []; for (var i = 1; i <= 16; i++) { 
  if (i<=9) { box.push(i); } else { box.push('')};
}; shuffle(box);

output=''; for (var i = 0; i < 16; i++) { 
  output += '<li>'; output += box[i]; output += '</li>';
}; document.getElementById('game').innerHTML = output;

NodeList.prototype.forEach = HTMLCollection.prototype.forEach = Array.prototype.forEach;

next=1,tlast=0,tstart=0,mistakes=0,best=10000;
tgame=[],tmove=[];

/*
stats to gather:
 most commonly mistaked numbers
 correlation between time viewed and completed
 best time by mistakes
 accuracy
 accuracy vs number of numbers
 accuracy vs number of squares
 most common first mistake

*/
score=document.getElementById('score');

var boxes = document.querySelectorAll('li');
boxes.forEach(function (tag,n) {
// #fixme onclick if no touchscreen, but need to find workaround for firefox click delay 
  tag.addEventListener('touchstart', function (m) {
    tnow=Date.now();
	m.preventDefault();
    tag=m.currentTarget;
    x=box[n];
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
        if (x==9) {
  
  tgame.push(tnow-tstart);        
  tgame.sort(function(a,b){return a-b;});
  Plotly.newPlot('games', [{type: 'bar', y: tgame}], {}, {showSendToCloud: true});

          score.innerHTML="Done in "+(tnow-tstart)+"ms with "+mistakes+" mistakes!<br>"+score.innerHTML;
          shuffle(box); mistakes=0;
          boxes.forEach(function (tag,n) { tag.style.background=''; tag.innerHTML=box[n] });
          next=1;
        } else {

 if (tlast>0) {         
  tmove.push(tnow-tlast);
  tmove.sort(function(a,b){return a-b;});
  Plotly.newPlot('moves', [{type: 'bar', y: tmove}], {}, {showSendToCloud: true});
 };
          console.log(tnow-tlast,"ms")
          tlast=tnow;
        } 
    }
  })
});