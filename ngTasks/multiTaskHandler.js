var multiTaskHandler = (function(window){ 
    function randomStr(count){
        var text = ""; possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        count = count || Math.floor(Math.random() * 10) || 5;

        for (var i = 0; i < count; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }
    //multi Task handler Class
    //Async/sync task manager 
    return function multiTaskHandler(mthModContructor, tasksList){
        var mth, syncTasks, asyncTasks, mthModule = {}, additionalTasks = [],  _return; 
        mth = this;

        //use mthModConstructon to create mthModule 
        if(typeof mthModContructor === 'function'){        
            mthModContructor.apply(mthModule, []);
            _return = mthModule._return; 
        }
             
        tasksList = tasksList || {};
        syncTasks = tasksList.syncTasks || Object.getOwnPropertyNames(mthModule);
        asyncTasks = tasksList.asyncTasks || [];    
       
        //remove _return from tasksList
        var r = syncTasks.indexOf('_return')
        if(r > -1){syncTasks.splice(r, 1)}      
            
        function taskRunner(mainCallback, mthModule, syncTasks, asyncTasks){  
        //console.log('_startTasks callBack: ' + mainCallback.toString())  

            var taskRunner, i;
            mainCallback = mainCallback || function(){}
            taskRunner = this;                

            if (syncTasks.indexOf('_endTasks') === -1) {syncTasks.push('_endTasks')}
            if (asyncTasks.indexOf('_startTasks') === -1) {asyncTasks.unshift('_startTasks')}

            mthModule._endTasks = function(err, results){
                if(typeof mainCallback === 'function'){
                    if(err || results){
                        mainCallback(err, results)
                    }else
                    if(typeof _return === 'function'){
                        mainCallback(err, _return())
                    }else{
                        mainCallback();
                    } 
                }
                    
                i = 0;
                return
            }  

            mthModule._startTasks = function(callBack){          
                callBack()
            }            

            i = 0;
            //execute each task (function) in the syncTasks array/object
            taskRunner.execSync = function(){    
                var fn = mthModule[syncTasks[i]];                                            
                                       
                function cb(err){         
                    if(err){                
                        if(typeof mainCallback === 'function'){mainCallback(err)}
                        return false
                    }

                    i++
                                        
                    taskRunner.execSync();              
                }   

                return fn(cb, mthModule._endTasks);                
            }
            
            //create a new instance
            taskRunner.execAsync = function(){
                var cb_counter = 0, return_val;                                
                
                for (var i = 0; i < asyncTasks.length; i++) {                
                    tasks_fn(asyncTasks[i]);                                                                                   
                }

                function tasks_fn(taskName){            
                    var fn = mthModule[taskName]                

                    function cb(err){
                        if(err){                
                            if(typeof mainCallback === 'function'){mainCallback(err)}
                            return false
                        }
                        //add the results to the correct property of the results obj                    
                        cb_counter++; 

                        //after running async tasks run sync tasks
                        if(cb_counter >= asyncTasks.length){                     
                            taskRunner.execSync();                            
                        }
                    }

                    return_val = fn(cb, mthModule._endTasks); 
                }    

                return return_val
            }

            return taskRunner            
        }

        function isValidTaskList(tasksNames){

            if(!(tasksNames instanceof Array)){
                throw 'tasksJS ERROR: setTasks & setTasksAsync functions must pass an array of strings'
            }

            for (var i = 0; i < tasksNames.length; i++) {
                if(!(mthModule[tasksNames[i]])){
                    return false
                }            
            }
            return true
        }
        
        mth.setTasks = function(syncList){        
            syncList = (syncList) ? Array.from(syncList) :Object.getOwnPropertyNames(mthModule);

            if(isValidTaskList(syncList)){
                //creates an new instance of tasks if contstructor was passed on init
                if(typeof mthModContructor === 'function'){
                    return new multiTaskHandler(mthModContructor, {syncTasks:syncList}) ;     
                }else{
                    syncTasks = syncList;
                }
            }else{
                throw 'tasksJS ERROR: multiTaskHandler Class ---> Invalid taskList!!!';
            }   
        }
        
        mth.setTasksAsync = function(asyncList, syncList){
            syncList = (syncList) ? Array.from(syncList) : [];
            asyncList = (asyncList) ? Array.from(asyncList) :Object.getOwnPropertyNames(mthModule);
            
            if(isValidTaskList(asyncList) && isValidTaskList(syncList)){
                //creates an new instance of tasks if contstructor was passed on init
                if(typeof mthModContructor === 'function'){
                    return new multiTaskHandler(mthModContructor, {syncTasks:syncList, asyncTasks:asyncList}) ;    
                }else{
                    syncTasks = syncList;
                    asyncTasks = asyncList;
                }
            }else{
                throw 'tasksJS ERROR: multiTaskHandler Class ---> Invalid taskList!!!';
            }        
        }

        mth.runTasks = function(){
            var args = [], callBack, i = 1, _mthModule = {};
            //seperate the callBack from the remaining arguments
            if(typeof arguments[0] === 'function'){
                callBack = arguments[0];                        
            }

            for (i; i < arguments.length; i++) {
                args.push(arguments[i])
            }        
            
            if (args.length > 0 && typeof mthModContructor === 'function'){
                //create new instance of the mthModule with new args
                mthModContructor.apply(_mthModule, args);
            }else{
                _mthModule = mthModule;
            }
            
            //add additional tasks to mthModule
            for (var i = 0; i < additionalTasks.length; i++) {
                _mthModule[additionalTasks[i].name] = additionalTasks[i].fn 
            }                    

           //create new instance of the taskRunner to run methods on the mthModule
           return new taskRunner(callBack, _mthModule, syncTasks, asyncTasks).execAsync();          
        }
        
        mth.addTask = function(name, fn){
            name = name || randomStr();
            additionalTasks.push({name:name, fn:fn})

            if(syncTasks.indexOf('_endTasks') === syncTasks.length - 1){
                syncTasks.pop();
                syncTasks.push(name);
                syncTasks.push('_endTasks');
            }else{
                syncTasks.push(name);    
            }
            
            return mth
        }

        mth.addTaskAsync = function(name, fn){
            name = name || randomStr();
            additionalTasks.push({name:name, fn:fn})
            asyncTasks.push(name);
            return mth   
        }
        //tasks an array of random fns to add to syncTasks list
        mth.addMultiTask = function(tasksArr){
            for (var i = 0; i < tasksArr.length; i++) {
                mth.addTask(null, tasksArr[i]);
            }
            return mth
        }
        //tasks an array of random fns to add to asyncTasks list
        mth.addMultiTaskAsync = function(tasksArr){
            for (var i = 0; i < tasksArr.length; i++) {
                mth.addTaskAsync(null, tasksArr[i]);
            }        
            return mth
        }

        //if mth is initialzed without a construnction don't add setArgs fn
        if(typeof mthModContructor === 'function'){
            mth.setArgs = function(){
                var args = [];
                for (var i = 0; i < arguments.length; i++) {
                    args.push(arguments[i]);
                }
                //overwrite mthModule with new one with args
                mthModContructor.apply(mthModule, args);
                return mth
            }    
        }
        

        //a subscription will exect the syncTasks every x seconds
        mth.createSubscription = function(seconds){
            
            var subscription = function(){
                var runningSub;
                
                var interval = (seconds) ? seconds * 1000: 1000;
                
                this.start = function(){ 
                    var args = [], callBack, i = 1, _mthModule = {};
                    //seperate the callBack from the remaining arguments
                    if(typeof arguments[0] === 'function'){
                        callBack = arguments[0];                        
                    }

                    for (i; i < arguments.length; i++) {
                        args.push(arguments[i]);
                    }        
                    
                    if (args.length > 0 && typeof mthModContructor === 'function'){
                        //create new mthModule with new args
                        mthModContructor.apply(_mthModule, args);
                    }else{
                        _mthModule = mthModule;
                    }
                                
                   //use setInterval to run taskRunner on repeat                   
                    runningSub = setInterval(new taskRunner(callBack, _mthModule, syncTasks, asyncTasks).execAsync, interval); 
                }

                this.end = function(){                
                    clearInterval(runningSub);
                }
            }           

            return new subscription()
        }   
        
        return mth
    }

})(window)
