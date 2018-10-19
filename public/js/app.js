var app = angular.module("myApp", ["ngRoute"]);
app.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        templateUrl : "/public/templates/login.html",
        controller: "loginController"
    })
    .when("/home",{
        templateUrl: "/public/templates/home.html",
        controller: "homeController",
        resolve:{
            auth: ['authService', function($auth) {
                return $auth.validateUser();
            }]
        }
    })
    .when("/viewresident/:resident_id", {
        templateUrl : "/public/templates/viewresident.html",
        controller:'viewResidentController',
        resolve:{
            auth: ['authService', function($auth) {
                return $auth.validateUser();
            }]
        }
    })
    .when("/viewtransaction/:transaction_id", {
        templateUrl : "/public/templates/viewtransaction.html",
        resolve:{
            auth: ['authService', function($auth) {
                return $auth.validateUser();
            }]
        }
    })
    .when("/residents/", {
        templateUrl : "/public/templates/residents.html",
        controller:"residentsController",
        resolve:{
            auth: ['authService', function($auth) {
                return $auth.validateUser();
            }]
        }
    })
    .when("/generatebill/",{
        templateUrl: "/public/templates/generatebill.html",
        resolve:{
            auth: ['authService', function($auth) {
                return $auth.validateUser();
            }]
        }
    })
    .when("/generatereciept/",{
        templateUrl:"/public/templates/generatereciept.html",
        resolve:{
            auth: ['authService', function($auth) {
                return $auth.validateUser();
            }]
        }
    })
    .when("/configurations/",{
        templateUrl: "/public/templates/configurations.html",
        resolve:{
            auth: ['authService', function($auth) {
                return $auth.validateUser();
            }]
        }
    })
    .otherwise({
        redirectTo:"/"
    });
});

app.controller('MainController',['$rootScope','$scope','$location','authService',function(rootScope,scope,$location,authService){
    rootScope.loggedIn = false;
    if(sessionStorage.accessToken){
        sessionStorage.removeItem('accessToken');
    }
    if(sessionStorage.user){
        sessionStorage.removeItem('user');
    }

    scope.logOut = function(){
        authService.logOut();
        rootScope.loggedIn = false;
        $location.path('/')
    }

}]);

app.controller('loginController',['$rootScope','$scope','$location','authService',function(rootScope,scope,$location,authService){
    rootScope.currentPage = "Login";
    scope.login = function(){
        scope.authenticationFailed = false;
        scope.logging = true;
        authService.authenticate(scope.username,scope.password);
    }

    scope.$on("UserAuthenticationSuccess",function(event,data){
        scope.logging = false;
        scope.authenticationFailed = false;
        sessionStorage.setItem('accessToken',data.token);
        sessionStorage.setItem('user',data.username);
        rootScope.user = sessionStorage.user;
        rootScope.loggedIn = true;
        $location.path('/home');
    });

    scope.$on("UserAuthenticationFailure",function(event,data,status){
        scope.logging = false;
        scope.authenticationFailed = true;
        var toastHTML = '<span>Incorrect Username or Password</span>';
        M.toast({html: toastHTML,displayLength:3000});
    });

    scope.$on("AuthRequestFailure",function(event){
        scope.logging = false;
        scope.authenticationFailed = true;
        var toastHTML = '<span>Internal Server error occured</span><button class="btn-flat toast-action">OK</button>';
        M.toast({html: toastHTML,displayLength:5000});
    });
    
}]);


app.controller('homeController',['$scope','$rootScope','$q','$location','resourceFactory',function(scope,rootScope,$q,location,resourceFactory){
    rootScope.currentPage = "Dashboard";
    let promises = {
        residents: resourceFactory.getAllResidents(),
        transactions: resourceFactory.getAllTransactions()
    }
    

    $q.all(promises).then(function(values){
        rootScope.blockUI = false;
        scope.totalResidents = values.residents.data.length;
        scope.totalTransactions = values.transactions.data.length;
        scope.transactions = values.transactions.data;  
    });


}]);

app.controller('residentsController',['$scope','$rootScope','$q','$location','resourceFactory',function(scope,rootScope,$q,$location,resourceFactory){
    rootScope.currentPage = "Residents";

    let promises = {
        residents:resourceFactory.getAllResidents()
    }

    $q.all(promises).then(function(values){
        rootScope.blockUI = false;
        scope.totalResidents = values.residents.data.length;
        scope.residents = values.residents.data;
        console.log(scope.residents);
    });

    scope.goTo = function(id){
        $location.path('/viewresident/'+id);
    }

    scope.pageLimit = 2;
}]);


app.controller('viewResidentController',['$scope','$rootScope','$q','$location','resourceFactory','$routeParams',function(scope,rootScope,$q,$location,resourceFactory,routeParams){
    rootScope.currentPage = 'Resident: '+routeParams.resident_id;
    
    let promises = {
        resident: resourceFactory.getResident(routeParams.resident_id)
    }

    $q.all(promises).then(function(values){
        rootScope.blockUI = false;
        scope.resident = values.resident.data;
        scope.emails = scope.resident.email.join(', ');
        scope.phones = scope.resident.phone.join(', ');
        scope.isTransaction = false;
        if(scope.resident.transactions){
            scope.isTransaction = true;
            scope.resident.transactions.forEach(function(transaction){
                if(transaction.type == "Bill"){
                    transaction.total = transaction.bill.total;
                }
                if(transaction.type == "Reciept"){
                    transaction.total = transaction.reciept.total;
                }
            });
        }
    });

    scope.goTo = function(transactionId){
        $location.path('/viewtransaction/'+transactionId);
    }

    

}]);