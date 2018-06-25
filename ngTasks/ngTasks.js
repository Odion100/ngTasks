var PREFIX_REGEXP = /^((?:x|data)[:\-_])/i;
var SPECIAL_CHARS_REGEXP = /[:\-_]+(.)/g;

/**
 * Converts all accepted directives format into proper directive name.
 * @param name Name to normalize
 */
function normalize(name) {
  return name
    .replace(PREFIX_REGEXP, '')
    .replace(SPECIAL_CHARS_REGEXP, fnCamelCaseReplace);
}

function fnCamelCaseReplace(all, letter) {
  return letter.toUpperCase();
}

function denormalize(name){
    return name.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
};
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
function multiTaskHandler(mthModContructor, tasksList){
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


var tasks = (function(window){       
    var _app = angular.module('ngTasks', ['ui.router'])

    function configAngularApp(uiConfig){
        _app.config(['$urlRouterProvider','$stateProvider',
            function($urlRouterProvider, $stateProvider){

                //if uiConfig has been set pass configuration duties on to it
                if(typeof uiConfig === 'function'){
                    uiConfig($urlRouterProvider, $stateProvider);
                }else{
                    //else use default config                    
                    $urlRouterProvider.otherwise('/ngTasks');                
                    $stateProvider.state('ngTasks',{url:'/tasksJS',templateUrl:'templates/main.html'})                      
                }

                      
            }
        ])
        .filter('$$unsafe', function($sce){ 
            return function(data){
                if(!isNaN(data) && data !== null){
                    data = data.toString();
                }
                return $sce.trustAsHtml(data); 
            }
        })
    }        
    
    var ngService = angular.injector(['ng', 'ngFileUpload']).get, component_cache = [], isRoot = true, templateNameSpace = {};             
    
    function tasks(){        
        var tasks = window.tasks || (window.tasks = {}), modules = {}, services = {}, mods = [], initAsync = [], initSync = [], configModule ={};
        var thisComponent = {}, loadedComponents = {}, onCompleteHandlers = [];        

        tasks.loadService = loadService;
        tasks.module = addModule;                
        tasks.config = config;
        tasks.scope = addScope
        tasks.initComponent = initComponent;
        tasks.loadComponent = loadComponent;
        tasks.ngService = ngService    
        tasks.uiRouter = setUIConfig;

        var uiConfig = undefined;
        function setUIConfig(handler){
            uiConfig = handler;
            setInit();
            return tasks
        }
        
        if(isRoot){
            isRoot = false;     
            
            thisComponent.name = 'root';
            thisComponent.name_space = 'root';  
            thisComponent.scopes = [];     
            component_cache.push(thisComponent);
            //The root component will initialize angularjs once all other components are loaded
            onCompleteHandlers.unshift(initializeAngular)
        }

        function initializeAngular(){                
            _app.directive('scopeNsp', function($compile){
                return {
                    restrict : 'A',
                    controller : "@",
                    name:"scopeNsp",
                    replace:false,  
                    priority:1,
                   // terminal:true,                   
                    template:function(tElement, tAttrs){

                        var names = tAttrs.scopeNsp.split('.');

                        var c = obj(component_cache).findByKey('name_space', names[0]+'.'+names[1])[0];
                        var s = obj(c.scopes).findByKey('name', names[2])[0];
                        
                        return s.options.template;                      
                    }/*,
                    templateUrl:function(tElement, tAttrs){
                        var names = tAttrs.scopeNsp.split('.');

                        var c = obj(component_cache).findByKey('name_space', names[0]+'.'+names[1])[0];
                        var s = obj(c.scopes).findByKey('name', names[2])
                        
                        return s.options.templateUrl; 
                    }*/          
                }   
            })

            _app.directive('componentNsp', function($compile){
                return {
                    restrict : 'A',
                    scope:{},   
                    replace:false,                   
                    name:"componentNsp",                     
                    template:function(tElement, tAttrs){
                       var c = obj(component_cache).findByKey('name_space', tAttrs.componentNsp)[0];
                        return c.elemTemplate.innerHTML;   
                    }          
                }   
            })

            configAngularApp(uiConfig);

            angular.bootstrap(document, ['ngTasks'])
        }

        function initComponent(options){
            options.templateUrl = options.templateUrl.toLowerCase();
            var c =  obj(component_cache).findByKey('templateUrl', options.templateUrl)[0];

            if(c){
                thisComponent = c;
                thisComponent.createClone = cloneComponent;
            }else{
                thisComponent.templateUrl = options.templateUrl; 
            }   
            setInit();
            return tasks                     
        }

        function refreshComponents(){
            console.log('you have to update refresh scope');
            thisComponent.scopes.forEach(function(s){                        
                var e = $(s.name)[0]
                if(e){ angular.element(e).scope().$digest() };                
            })            
        }

        function loadComponent(componentName, options){
            //ensure templateUrl is in lowcase to avoid case sensativity 
            //when performing a search in another instance of the app int initComponent
            options.templateUrl = options.templateUrl.toLowerCase();                
            initAsync.unshift(new componentLoader(componentName, options).run)
            setInit();
            return tasks
        }

        function cloneComponent(c, cb){
            
            c.scopes.forEach(function(_scope){
                scopeFactory(_scope, c)
            })
            var arr = [];
            obj(loadedComponents).forEach(function(value, name){
                arr.push(componentLoader(name, value).run)
            })

            multiTaskHandler()
            .addMultiTaskAsync(arr)
            .runTasks(function(){
                cb();
            })
        }
        function componentLoader(componentName, options){  

            return {
                run:function(next){
                    var $templateRequest = ngService('$templateRequest');      

                    var c =  obj(component_cache).findByKey('templateUrl', options.templateUrl)[0];

                    if(c){
                        var elemTemplate = document.createElement('div');
                        elemTemplate.innerHTML = c.initial_template

                        loadedComponents[componentName] = {
                            templateUrl:options.templateUrl,
                            elemTemplate:elemTemplate,
                            initial_template:c.initial_template,
                            onLoad:next,
                            name:componentName,
                            name_space:thisComponent.name+"."+componentName,
                            scopes:c.scopes,
                            createClone:c.createClone
                        };

                        component_cache.push(loadedComponents[componentName]); 

                       c.createClone(loadedComponents[componentName], next);
                       new componentInitializer(componentName)                      
                    }else{
                        $templateRequest(options.templateUrl)
                        .then(templateProcessor, function(err){
                            console.log(err);
                            loadedComponents[componentName] = {err:err};
                            next();
                        })
                    }             
                        

                    function templateProcessor(template){

                        var elemTemplate = document.createElement('div');
                        elemTemplate.innerHTML = template;
                        
                        loadedComponents[componentName] = {
                            templateUrl:options.templateUrl,
                            elemTemplate:elemTemplate,
                            initial_template:template,
                            onLoad:next,
                            name:componentName,
                            name_space:thisComponent.name+"."+componentName,
                            scopes:[]
                        };

                        component_cache.push(loadedComponents[componentName]);                        
                            
                        //get all script tags
                        var scripts = elemTemplate.getElementsByTagName('script');
                        //load scripts separately from template
                        for (var i = 0; i < scripts.length; i++) {                            
                            var script = document.createElement('script');
                            script.setAttribute('src', scripts[i].src);
                            //insert scripts into document
                            document.body.appendChild(script);
                            //remove scripts from template
                            scripts[i].parentNode.removeChild(scripts[i]);
                        }


                        new componentInitializer(componentName);
                                                
                    }
                }
            }                                    
        }        
        function componentInitializer(componentName){
             if(thisComponent.name === 'root'){
                _app.directive(componentName, function($compile){
                    return {
                        restrict : 'E',
                        replace:false,                                                             
                        terminal: false,
                        priority: 1000,
                        link: function (scope, element, attrs) {  
                            if(attrs.componentNsp){
                                return false
                            }                                    
                            attrs.$set('component-nsp', 'root.'+componentName)
                            $compile(element)(scope);
                        }        
                    }  
                })
                

            }else{                            
                 //add componentNsp attribute to the
                 var componentElements = thisComponent.elemTemplate.getElementsByTagName(denormalize(componentName));

                for (var i = 0; i < componentElements.length; i++) {
                    componentElements[i].setAttribute('component-nsp', thisComponent.name+"."+componentName)
                }                           
            }
        }
        function scopeFactory(mod, _component){

            var thisMod = {};
            thisMod.useModule = useModule;        
            thisMod.useService = useService; 
            thisMod.useComponent = useComponent;
            thisMod.useConfig = useConfig;
            thisMod.useScope = useScope;

            function useService(serviceName){
                return passService(serviceName, mod);                      
            }

            function useModule(modToUse){              
                return getMod(modToUse, mod);                        
            }         

            function useComponent(name){
                return loadedComponents[name]
            }

            function useConfig(){
                return configModule
            }

            function useScope(){

            }

            mod.scopeConstructor.apply(thisMod, []);
            //add the scope to thisComponent object
            //thisComponent.scope[mod.name] = thisMod;

            new scopeInitializer(mod.name, thisMod, mod.options, _component);
            thisMod.useModule = null;        
            thisMod.useService = null; 
            thisMod.useComponent = null;
        }
        
        function scopeInitializer(name, scopeMod, options, _component){            
            _component = _component || thisComponent;
            var scopeElements = _component.elemTemplate.getElementsByTagName(denormalize(name));
            
            var ns = _component.name_space+'.'+name;

            for (var i = 0; i < scopeElements.length; i++) {
                scopeElements[i].setAttribute('scope-nsp', ns);
            }

            _app.controller(ns, function($scope){
                $scope[name] = scopeMod;
            });         
        } 

        function addScope(componentName, scopeConstructor, options){    
            options  = options || {};
            thisComponent.scopes.push({
                name:componentName, 
                options:options,
                scopeConstructor:scopeConstructor,                
                dependencies:[],
                dependents:[],
                service_dependencies:[]                
            })
            
            setInit();
            return tasks
        }

        function initModules(cb) {
            
            for (var i = 0; i < mods.length; i++) {                
                modFactory(mods[i]);                
            }
            
            for (var i = 0; i < thisComponent.scopes.length; i++) {
                scopeFactory(thisComponent.scopes[i]);
            }
            
            //by clearing these arrays more modules can be added after the original initialization
            initSync = [];
            initAsync = [];            
            is_set = false;   
            cb();         
        }

        function getMod(modName, user){        
            return modules[modName].mod;                
        }

        function passService(serviceName, user){
            return services[serviceName].service; 
        }
        
        function modFactory(mod){
            var thisMod = {}, events = {};     
            thisMod.useModule = useModule;        
            thisMod.useService = useService;
            thisMod.useComponent = useComponent;
            thisMod.useConfig = useConfig;        
            thisMod.emit = emit;
            thisMod.on = on;

            thisMod._instance = {};
            thisMod._instance.usedBy = 'app';
            thisMod._class = 'module';
            thisMod._name = mod.name;

            function useService(serviceName){
                return passService(serviceName, mod);                      
            }

            function useModule(modToUse){              
                return getMod(modToUse, mod);                        
            }        

            function useComponent(name){
                return loadedComponents[name]
            }

            function useConfig(){
                return configModule
            }

            function emit(eventName, emitter, emitData){            
                if(events[eventName]){
                    subs.forEach(function(sub){sub()})
                }                           
            }

            function on(eventName, handler){                                    
                events[eventName] = events[eventName] || {};            
                            
                events[eventName].subscribers = events[eventName].subscribers || [];
                events[eventName].subscribers.push(handler)                
            }

            mod.modConstructor.apply(thisMod, []);
            modules[mod.name].mod = thisMod;         
        }


        var is_set = false;
        //modules need to be initialized only after services have been loaded
        //so we're collect modules, services, and config init functions to be run in
        //a paricular sequence. this is handled by multiTaskHandler in inti function below
        function setInit(){
             //setTimeout will inti app after all modules are added to the modules array above            
            if(!is_set){
                //because js is "single threaded", this will only run at next avialable moment when all fns have executed
                is_set = true; 
                setTimeout(init, 1)
            }
            
        }
        function addModule(modName, modConstructor){    
            modules[modName] = {            
                modConstructor:modConstructor,
                dependencies:[],
                dependents:[],
                service_dependencies:[],
                name:modName,  
            }
      
            mods.push(modules[modName])    
            setInit()  
            setInit();
            return tasks 
        }    

        function loadService(name, option){   
            var uri = 'http://' + option.host +':'+ option.port + option.route 

             services[name] = {                                                                            
                dependents:[],
                name:name,
                uri:uri,
                connection_attemps:0,
                service:{}                            
            };  

            initAsync.unshift(new getService(uri, name).run);
            setInit();

            _serv = name;
            return tasks
        }  

        var _serv = undefined;
        function onLoad(handler){    
            services[_serv].onLoad = configHandler(handler).run;
        }

        function getService(url, name){
                 
            return {//run will be called by the mth
                run:function(next){
                    _client.request({
                        method:'GET',
                        url:url
                    }, function(err, data){
                        if (err) {
                            services[name].connection_attemps++;
                            console.log(' -- FAILED CONNECTION TO SERVICE: '+name +'---(after '+services[name].connection_attemps+' attempts)');                                
                            //console.log(err);
                            //user can check for the existance of connectionErr property inside modules to check if the service has loaded correctly
                            //so that the app can optionally be made to work even when some services fail                        
                            services[name].service.connectionErr = true;
                            services[name].service.err = err;

                            //try to establish connection up to ten times
                            if(services[name].connection_attemps < 10){                            
                                setTimeout(function(){                                
                                    getService(url, name).run();                            
                                }, services[name].connection_attemps*1500);
                            } 
                            
                        }else{                    
                           console.log(' -- SUCCESSFUL CONNECTION TO SERVICE: '+name +'---(after '+services[name].connection_attemps+' attempts)');

                            services[name].service.connectionErr = false;
                            services[name].service.err = null;
                            createServiceAPI(services[name], data); 

                            if(typeof services[name].onLoad === 'function'){
                                services[name].onLoad()
                            }                                         
                        }
                        if(typeof next === 'function'){next()}                    
                    })
                }
            }
        }

        function createServiceAPI(serviceHolder, api){

            var service = serviceHolder.service, maps = api.maps;
            //each map in apis.maps describes a backend serverMod
            for (var i = 0; i < maps.length; i++) {
                //serverModRequestHandler creates replica of the backend serverMod api 
                //that will send a request to that serverMod's method
                service[maps[i].modName] = new serverModRequestHandler(maps[i], api.host, serviceHolder.name)             
            }        
        }

        function serverModRequestHandler(map, host, serviceName){
            //handles request to backend server mod

            //use map to regenerate backend  api
            //a map contains info on how to call a backend serverMod and what methods it has
            var serverMod = {}, path = 'http://' + host + '/' + map.route.join('/'), method_names = map.methods;
            
            for (var i = 0; i < method_names.length; i++) {                
                serverMod[method_names[i]] = reqHandler(method_names[i] , map.config[method_names[i]].request_method).run
            }

            var  attempts = 0;
            function mapErrHandler(new_api, req, callBack, handler){                    
                attempts++
                if(attempts >= 3){                
                    throw "tasksJS ERROR: Invalid Map!!! FAILED TO CONNECT TO APP AFTER "+attempts+" ATTEMPTS!!!"
                }else{
                    var new_maps = new_api.maps;

                    //use updated new_maps to update the path for each serverMod of this service
                    for (var i = 0; i < new_maps.length; i++) {
                        
                        var new_route = new_maps[i].route.join('/');                        
                        //loop throuhg each serverMod in the service and use _updatePath method to update the route to the serverMod
                        services[serviceName].service[new_maps[i].modName]._updatePath(new_route, new_api.host, new_maps[i].nsp);
                    }

                    if(typeof services[serviceName].onLoad === 'function'){
                        //run onLoad Handler first
                        services[serviceName].onLoad(function(){
                            //use this handle on reqHandler to resend the request
                            handler.run(req.data, function(err, data){
                                callBack(err, data);
                                attempts = 0;
                            })
                        })
                    }else{
                        //use this handle on reqHandler to resend the request
                        handler.run(req.data, function(err, data){
                            callBack(err, data);
                            attempts = 0;
                        })
                    }                        
                }              
            }            
            //paths used for single and multi file uploads
            var sfPath = 'http://' + host + '/sf/' + map.route.join('/');
            var mfPath = 'http://' + host + '/mf/' + map.route.join('/');

            function reqHandler(method_name, request_method){                                
                var handler =  {
                    run:function(data, callBack){
                        //make sure data is empty object by default
                        function cb(err, data){
                            if (err) {
                                console.log(err);
                                if (err.invalidMap) {
                                    mapErrHandler(err, req, callBack, handler)                          
                                }else{
                                    if(typeof callBack === 'function'){callBack(err)}
                                    refreshComponents();     
                                }                                                            
                            }else{                                
                                if(typeof callBack === 'function'){callBack(null, data)}                            
                                refreshComponents();
                            }
                        } 
                                               
                        data = (data === null || data === undefined)?{}:data;                        
                        var req = {
                            method:request_method,                            
                            data:data
                        }

                        if(data.file){
                            req.url = sfPath+'/'+method_name,                    
                            _client.upload(req, cb);
                        }else if(data.files){
                            req.url = mfPath+'/'+method_name,                    
                            _client.upload(req, cb);
                        }else{
                            req.url = path+'/'+method_name,
                            _client.request(req, cb);    
                        }                        
                    }
                }
                return handler
            }            

            serverMod._updatePath = function(new_route, new_host, new_nsp){
                path = 'http://' + new_host + '/' + new_route
                socket.disconnect();
                socket = initSocketConnection(new_nsp)                
            } 
           /*-------------WebScoket Event Handling-----------------------*/                

           var eventHandlers = {};

            function dispatch(e){
                if(eventHandlers[e.name]){
                    e.received_by = appName;
                    e.received_at = Date();  
                    eventHandlers[e.name].subscribers.forEach(function(sub){
                        sub(e);
                    })
                }
            }

            serverMod.on = function(eventName, handler){
                eventHandlers[eventName] = eventHandlers[eventName] || {};
                eventHandlers[eventName].subscribers = eventHandlers[eventName].subscribers || [];
                eventHandlers[eventName].subscribers.push(handler)
            }
                
            function reconnectService(){                

                _client.request({
                    method:'GET',
                    url:services[serviceName].uri
                }, function(err, new_api){
                    if(err){
                        console.log(err)
                        //pass the job onto getService function   
                        getService(services[serviceName].uri, serviceName).run();
                    }else{
                        var new_maps = new_api.maps;

                        //use updated new_maps to update the path for each serverMod of this service
                        for (var i = 0; i < new_maps.length; i++) {
                            
                            var new_route = new_maps[i].route.join('/');                        
                            //loop throuhg each serverMod in the service and use _updatePath method to update the route to the serverMod
                            services[serviceName].service[new_maps[i].modName]._updatePath(new_route, new_api.host, new_maps[i].nsp);
                        }

                        if(typeof services[serviceName].onLoad === 'function'){
                            services[serviceName].onLoad()
                        } 
                    }
                })
            }

            function initSocketConnection(name_space){
                var socket = io.connect(name_space)
                console.log(map.nsp)
                socket.on('dispatch', function (data) {
                    //console.log(data);  
                    dispatch(data)
                });

                socket.on('disconnect', function(data){
                    console.log('on disconnect------------!')
                    console.log(data) 
                    dispatch({
                        name:'disconnect',
                        data:data
                    })
                    reconnectService()                  
                })

                socket.on('connect', function(data){
                    console.log('on connect------------!')
                    console.log(data)
                })
                return socket
            }
           
           var socket = initSocketConnection(map.nsp)
           return serverMod
        }  

        function configHandler(handler){

            return {//will be called by mth
                run:function(next){
                    //if config is used next needs to be called for app to start

                    var configMod = {}                
                    
                    configMod.next = function(){
                        if(typeof next === 'function'){next()}
                    }

                    configMod.done = configMod.next
                    
                    configMod.useService = function useService(serviceName){
                        return services[serviceName].service;
                    }

                    handler.apply(configMod);
                }
            }
        }

        function config(handler){
            initSync.unshift(new configHandler(handler).run)
            setInit();
            return tasks
        }

        function init(){
            //last fn to call is intiMods 
            initSync.push(initModules);

            multiTaskHandler()
            .addMultiTask(initSync)
            .addMultiTaskAsync(initAsync)
            .runTasks(loadComplete)
        }
        
        // emit load event when component has fully loaded
        
        function registerHandler(cb){
            onCompleteHandlers.push(cb)
        }        
        function loadComplete(){
            onCompleteHandlers.forEach(function(cb){
                cb();               
            });
             

            if(typeof thisComponent.onLoad === 'function'){
                thisComponent.onLoad();
                thisComponent.onLoad = null;
            }
        }
        setInit();
        return tasks
    }


var objHandler = function(obj){
    var handler = {}
    handler.cloneKeys = cloneKeys;
    handler.uniqueKeys = uniqueKeys;
    handler.sumOfKeys = sumOfKeys
    handler.findByKey = findByKey;
    handler.spliceByKey = spliceByKey;
    handler.navigate = navigate;

    if(!Array.isArray(obj)){
        //obj(OBJ).forEach & obj(OBJ).forEachSync loops through each property on an object        
        handler.forEach = function(cb, descend){
            var pNames = Object.getOwnPropertyNames(obj), index = -1; 
            if(typeof cb === 'function'){
                pNames.forEach(function(pName){
                    cb(obj[pName], pName)
                })
            }else{
                throw "obj(ERR): obj(OBJ).forEach(CB) must take a callback function as its argument!"
            }            
        }  
        handler.forEachSync = function(cb, descend){
            var pNames = Object.getOwnPropertyNames(obj), index = -1;             
            
            function next(){            
                index =index++;
                cb(obj[pNames[index]], pNames, next);
            }
            next()
        }      
    }else{
        //obj(OBJ).forEachSync loops through each index of an array
        handler.forEachSync = function(cb, descend){
            var index = (descend)? obj.length+1:-1;             
            
            function next(){                     
                if(descend){
                    index--
                    var last = (index <= 0);
                }else{
                    index++
                    var last = (index >= obj.length-1);
                }
                  
                if(index < obj.length && index > -1){                                        
                    cb(obj[index], index, next, last);
                }                       
            }
            next()
        }
    }


    function cloneKeys(keys, toObj){
        var copy = toObj || {};

        var pNames = keys || Object.getOwnPropertyNames(obj);
        
        for (var i = 0; i < pNames.length; i++) {
            copy[pNames[i]] = obj[pNames[i]];
        } 

        return copy
    };

    function uniqueKeys(key){
        var uniqueList = [], arr = obj;
        
        for (var i = 0; i < arr.length; i++) {
            if( uniqueList.indexOf(arr[i][key]) === -1 ){
                uniqueList.push(arr[i][key]);
            }
        }
        return uniqueList
    };
    
    function sumOfKeys(key){
        var sum = 0, arr = obj; 

        for (var i = 0; i < arr.length; i++) {
            var num = arr[i][key]*1
            ; num = (isNaN(num))? 0:num; sum = sum + num 
        } 
        return sum
    }    
    function findByKey(key, searchArr, multi){
        var searchArr = (Array.isArray(searchArr)) ? searchArr : [searchArr]
        var results = [];

        for (var i = 0; i < obj.length; i++) {
            if(searchArr.indexOf(obj[i][key]) > -1 ) {
                results.push(obj[i]);
                if(!multi){break}
            }
        }

        return results
    }

    function spliceByKey(key, searchArr, multi){
        var searchArr = (Array.isArray(searchArr)) ? searchArr : [searchArr]
        var results = [];

        for (var i = 0; i < obj.length; i++) {
            if(searchArr.indexOf(obj[i][key]) > -1 ) {
                results.push(obj[i]);
                obj.splice(i, 1);
                i--;                
                if(!multi){break}
            }
        }

        return results
    }
    function navigate(pNames, start){
        var _obj = obj;

        for (var i = start || 0; i < pNames.length; i++) {
           _obj = _obj[pNames[i]]
        }
        return _obj
    }    

    return handler
}

    function obj(_obj){
        return new objHandler(_obj)
    }    

    function client(){

        var http = ngService('$http'), upload = ngService('Upload');

        var client = {};        
        client.request = request;        
        client.upload = fileUploadHandler       
        //request can only be made through the request obj and request handler
        function request(method, url, data){
            return {
                _id:uniqueNumber(),                
                cId:'clientId',                
                url:url,
                method:method,
                data:data
            };             
        }
        //request can only be made through the request obj and request handler
        function request (request, callBack){            
            http({
                method:request.method,
                url:request.url,
                data:request
            }).then(function successCallback(res){
                if (typeof callBack === 'function') {callBack(null, res.data)}                    
            }, function errorCallback(res){
                if(res.data){
                    if(res.data.errMsg){
                        console.log('dub requests')
                        showErrMsg(res.data.errMsg)
                    }                       
                }     
                
                if (typeof callBack === 'function') {callBack(res.data)}
                console.log(res);
            })
        }
        //borrowed code to create unique id from Date
        function uniqueNumber() {
            var date = moment()._d;
            
            // If created at same millisecond as previous
            if (date <= uniqueNumber.previous) {
                date = ++uniqueNumber.previous;
            } else {
                uniqueNumber.previous = date;
            }
            
            return date;
        }

        client.uniqueNumber = uniqueNumber;

        uniqueNumber.previous = 0;

        function showErrMsg(errMsg){
            if(errMsg){
                // $$msgbox.message = errMsg
                // $$msgbox.button2.show = false;
                // $$msgbox.show = true;                    
            }        
        }

        function fileUploadHandler(request, callBack){        
            upload.upload({
                url:request.url,
                data:request.data,
                arrayKey: ''
            }).then(function successCallback(res){
                if (typeof callBack === 'function') {callBack(null, res.data)}
                    console.log(res)
            }, function errorCallback(res){
                if(res.data){
                    if(res.data.errMsg){
                        console.log('dub requests')
                        showErrMsg(res.data.errMsg)
                    }

                } 
                if (typeof callBack === 'function') {callBack(res.data)}                
            })
        }

        return client

    }
    
    var _tasks = {app:function(){return new tasks()}}, _client = client()    

    //replace this with on load fn
    /*_tasks.init(function(err){        
        if(err){
            console.log(err);
        }
    });*/
    return _tasks
})(window)




