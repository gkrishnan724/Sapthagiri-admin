var app = angular.module('myApp');
app.service('authService',['$rootScope','$http','$q','$location',function(scope,$http,$q,$location){
    this.authenticate = function(username,password){
        $http.post('/api/login',{username:username,password:password}).then(function(result){
            if(result.status == 200){
                scope.$broadcast("UserAuthenticationSuccess",result.data);
            }
            else{
                scope.$broadcast("UserAuthenticationFailure",result.data,result.status);
            }
        },function(){
            scope.$broadcast("UserAuthenticationFailure");
        });
    }

    this.validateUser = function(){
        return $q(function(resolve,reject){
            if(sessionStorage.accessToken && sessionStorage.user){
                resolve();
                scope.loggedIn = true;
            }
            else{
                $location.path('/login')
                scope.loggedIn = false;
            }
        });
    }
}]);


app.service('resourceFactory',['$rootScope','$http',function(scope,$http){
    

    this.getResident = function(residentId){
        return $http.get('/api/viewresident/'+residentId)
    }

    this.getTransaction = function(transactionId){
        return $http.get('/api/viewtransaction'+transactionId)
    }

    this.getAllResidents = function(){
        return $http.get('/api/getallresidents');
    }
    
    this.getAllTransactions = function(){
        return $http.get('/api/getalltransactions');
    }

    this.newTransaction = function(){

    }

    this.newResident = function(){

    }

    this.getTransactionCopy = function(){

    }

    

}]);