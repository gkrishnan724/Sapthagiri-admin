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

    this.logOut = function(){
        if(sessionStorage.accessToken){
            sessionStorage.removeItem('accessToken');
        }
        if(sessionStorage.user){
            sessionStorage.removeItem('user')
        }
    }
}]);


app.service('resourceFactory',['$rootScope','$http',function(scope,$http){
    let accessToken = '';
    let headers = {};
    if(sessionStorage.accessToken){
        accessToken = sessionStorage.accessToken;
        headers.Authorization = 'Bearer ' + accessToken; 
    }

    this.getResident = function(residentId){
        scope.blockUI = true;
        return $http({
            method:'get',
            url: '/api/viewresident/'+residentId,
            headers:headers
        });
    }

    this.getTransaction = function(transactionId){
        scope.blockUI = true;
        return $http({
            method:'get',
            url: '/api/viewtransaction/'+transactionId,
            headers:headers
        });
    }

    this.getAllResidents = function(){
        scope.blockUI = true;
        return $http({
            method:'get',
            url: '/api/getallresidents',
            headers:headers
        });
    }
    
    this.getAllTransactions = function(){
        scope.blockUI = true;
        return $http({
            method:'get',
            url: '/api/getalltransactions',
            headers:headers
        });
    }

    this.newTransaction = function(){
        scope.blockUI = true;
    }

    this.newResident = function(){
        scope.blockUI = true;
    }

    this.getTransactionCopy = function(){
        scope.blockUI = true;
    }
}]);