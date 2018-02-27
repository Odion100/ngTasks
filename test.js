
var listingsView
var app = tasks.app()

app.loadService('listingsView', {
	route:'/listingsView',
	port:4200,
	host:'localhost'
})

.module('test1', function(){
	listingsView = this.useService('listingsView')
	console.log(listingsView)		
})

.scope('fileinput', function(){
	listingsView = this.useService('listingsView')
	console.log(listingsView)		

	this.sendFile = function(input){
		listingsView.listingsTbl.uploadTemplate({
			files:input.files,
			ad_id:mockAd._id,
		}, function(err, results){
			if(err){
				console.log(err);
			}else{			
				console.log(results);				
			}
		})
	}
}, {
	template:'<input type="file" onchange="angular.element(this).scope().fileinput.sendFile(this)" multiple>'
})

function getData(next){
	var search_options = {
		user_id:'5a5fcd9ee6f6e221448cd202',
		beds:5,
		baths:null,
		max_rent:2592,
		min_rent:663, 
		borough:'',
		neighborhood:'',
		address:'',
		limit:null,
		sort:1
	}

	console.log('listingsView.listingsTbl.getData (TEST START): ' + moment()._d)
	listingsView.listingsTbl.getData(search_options, function(err, results){
		if(err){
			console.log('listingsView.listingsTbl.getData (ERROR CALLBACK): ' + moment()._d)
			console.log(err);			
			if(typeof next === 'function'){next(err)};
		}else{
			console.log('listingsView.listingsTbl.getData (SUCCESS CALLBACK): ' + moment()._d)
			console.log(results)
			if(typeof next === 'function'){next(null, results)};
		}
	})
}

function downloadTemplate(next){
	var search_options = {
		user_id:'5a5fcd9ee6f6e221448cd202',
		beds:5,
		baths:null,
		max_rent:2592,
		min_rent:663, 
		borough:'',
		neighborhood:'',
		address:'',
		limit:null,
		sort:1
	}

	console.log('listingsView.listingsTbl.downloadTemplate (TEST START): ' + moment()._d)
	listingsView.listingsTbl.downloadTemplate({template:'Listings Upload Template.xlsm'}, function(err, results){
		if(err){
			console.log('listingsView.listingsTbl.downloadTemplate (ERROR CALLBACK): ' + moment()._d)
			console.log(err);			
			if(typeof next === 'function'){next(err)};
		}else{
			console.log('listingsView.listingsTbl.downloadTemplate (SUCCESS CALLBACK): ' + moment()._d)
			console.log(results)
			window.open(results.url)
			if(typeof next === 'function'){next(null, results)};
		}
	})
}