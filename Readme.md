## Introduction
Are you faster than Ai? (Or do you have as much free choice? :-p) That's pretty impressive, but I'm not convinced by the "cognitive tradeoff hypothesis."

[Click here to try it](http://mindfield.surge.sh/) 

Or even better, host it on your own PC so you can modify (improve) it by opening a terminal and typing:

    git clone https://github.com/dagelf/mindfield.git 
  
(Or just download the [zip](https://github.com/dagelf/mindfield/archive/master.zip) and extract it)
    
And then browse to file:///home/myuser/src/mindfield, or wherever you put it. You can then change the code in your browser (and learn Javascript!) by following the instructions below for the "Easiest Javascript coding environment".

Now is a good time to take the opportunity to set up better permissions on your filesystem - give yourself permissions in your /usr/src directory (if you have root):
    
    sudo chgrp `whoami` /usr/src; sudo chmod g+s /usr/src 
    
Or even better, create an src group, give it permissions, and add yourself. *While this is better, it requires logging out and in again otherwise the files won't be writable by you yet*
    
    sudo adduser src; sudo chgrp src /usr/src; sudo chmod g+s /usr/src; sudo usermod -a -G src `whoami`

And then get it:

    mkdir -p /usr/src/github/dagelf; cd /usr/src/github/dagelf    
    git clone https://github.com/dagelf/mindfield.git 

This is a quick javascript implementation of a game inspired by the chimp game featured on Vsauce [Mind field](https://www.youtube.com/playlist?list=PLZRRxQcaEjA4qyEuYfAMCazlL0vQDkIj2) Season 3, Episode 1: [The Cognitive Tradeoff Hypothesis](https://www.youtube.com/watch?v=ktkjUjcZid0) 

This was my first attempt at a javascript app, and purist that I am, I opted for "Vanilla JS". It was also a great excercise in getting a javascript development environment set up - which took longer than the actual game... After spending about an hour trying to get Firefox working, and downloading Developer version, after finding dead links linked to from their latest version browser, I threw in the towel and went Chrome. 

## Easiest Javascript coding environment
* git clone the repo
* Open Chrome
* In the Chrome address bar, type: /usr/src/github/dagelf/mindfield (or wherever you cloned it to)
* Press Shift+F5
* In the debug pane, choose Sources.
* In the left debug pane, choose "Filesystem"
* Choose "Add folder to workspace"
* Browse to the same path...

Whoohoo, you can now edit the source, reload, *debug, step, trace, watch*... everything you need to be a productive programmer. 

And I bet you'll beat my 1s record in no time. 

## Todo
Check the source comments
Feel free to fork and do pull requests... :-) 
