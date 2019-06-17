## Introduction
Are you faster than Ai? (Or do you have as much free choice? :-p) That's pretty impressive, but I'm not convinced by the "cognitive tradeoff hypothesis."

[Try it here](http://mindfield.surge.sh/) or run it on your own PC:

    git clone https://github.com/dagelf/mindfield.git 
    
And then browse to file:///home/myuser/mindfield, or wherever you put it.

Or take the opportunity to set up better permissions on your filesystem - give yourself permissions in your /usr/src directory:
    
    sudo chgrp `whoami` /usr/src; sudo chmod g+s /usr/src 
    
Or even better, create an src group, give it permissions, and add yourself. *While this is better, it requires logging out and in again otherwise the files won't be writable by you yet*
    
    sudo adduser src; sudo chgrp src /usr/src; sudo chmod g+s /usr/src; sudo usermod -a -G src `whoami`

And then get it:

    mkdir -p /usr/src/github/dagelf; cd /usr/src/github/dagelf    
    git clone https://github.com/dagelf/mindfield.git 

This is a quick javascript implementation of a game similar to the chimp game featured on Vsauce [Mindfield EP1](https://www.youtube.com/watch?v=iqKdEhx-dD4)

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
