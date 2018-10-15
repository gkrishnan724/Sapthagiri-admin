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
    .when("/viewresidents/", {
        templateUrl : "/public/templates/residents.html",
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

app.controller('MainController',['$rootScope','$scope','$location',function(rootScope,scope,$location){
    rootScope.loggedIn = false;
    if(sessionStorage.accessToken){
        sessionStorage.removeItem('accessToken');
    }
    if(sessionStorage.user){
        sessionStorage.removeItem('user');
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

app.controller('loginController',['$rootScope','$scope','$location','authService',function(rootScope,scope,$location,authService){
   
    scope.login = function(){
        scope.authenticationFailed = false;
        scope.logging = true;
        authService.authenticate(scope.username,scope.password);
    }

    

}]);


app.controller('homeController',['$scope','$rootScope','$location','resourceFactory',function(scope,rootScope,location,resourceFactory){
    rootScope.user = sessionStorage.user;

}]);