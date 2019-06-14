function shuffle(a) { var j, x, i; for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); x = a[i]; a[i] = a[j]; a[j] = x }}
var box = []; for (var i = 1; i <= 16; i++) { 
  if (i<=9) { box.push(i); } else { box.push('')};
}; shuffle(box);

x=document.querySelectorAll('div#score');
x.innerHTML='hello'

var output=''; for (var i = 0; i < 16; i++) { 
  output += '<li>'; output += box[i]; output += '</li>';
}; document.getElementById('game').innerHTML = output;

NodeList.prototype.forEach = HTMLCollection.prototype.forEach = Array.prototype.forEach;

var next=1,tlast=0,start=0,mistakes=0,best=10000;

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
      if (next==1) {start=tnow};
        tag.style.background='lime';
        boxes.forEach(function (tag,n) { tag.innerHTML='' });
        next++;
        if (x==9) {
          console.log("You won in ",tnow-start,"ms with ",mistakes," mistakes!");
          boxes.forEach(function (tag,n) { tag.style.background=''; tag.innerHTML=box[n] });
          next=1;
        } else {
          console.log(tnow-tlast,"ms")
          tlast=tnow;
        } 
    }
  })
});