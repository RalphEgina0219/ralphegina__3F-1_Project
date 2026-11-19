<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta content="IE=edge,chrome=1" http-equiv="X-UA-Compatible">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <title>LaundryFlow API v1</title>

    <link href="https://fonts.googleapis.com/css?family=Open+Sans&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="{{ asset("/vendor/scribe/css/theme-default.style.css") }}" media="screen">
    <link rel="stylesheet" href="{{ asset("/vendor/scribe/css/theme-default.print.css") }}" media="print">

    <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.10/lodash.min.js"></script>

    <link rel="stylesheet"
          href="https://unpkg.com/@highlightjs/cdn-assets@11.6.0/styles/obsidian.min.css">
    <script src="https://unpkg.com/@highlightjs/cdn-assets@11.6.0/highlight.min.js"></script>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jets/0.14.1/jets.min.js"></script>

    <style id="language-style">
        /* starts out as display none and is replaced with js later  */
                    body .content .bash-example code { display: none; }
                    body .content .javascript-example code { display: none; }
            </style>

    <script>
        var tryItOutBaseUrl = "http://localhost:8000";
        var useCsrf = Boolean();
        var csrfUrl = "/sanctum/csrf-cookie";
    </script>
    <script src="{{ asset("/vendor/scribe/js/tryitout-5.11.0.js") }}"></script>

    <script src="{{ asset("/vendor/scribe/js/theme-default-5.11.0.js") }}"></script>

</head>

<body data-languages="[&quot;bash&quot;,&quot;javascript&quot;]">

<a href="#" id="nav-button">
    <span>
        MENU
        <img src="{{ asset("/vendor/scribe/images/navbar.png") }}" alt="navbar-image"/>
    </span>
</a>
<div class="tocify-wrapper">
    
            <div class="lang-selector">
                                            <button type="button" class="lang-button" data-language-name="bash">bash</button>
                                            <button type="button" class="lang-button" data-language-name="javascript">javascript</button>
                    </div>
    
    <div class="search">
        <input type="text" class="search" id="input-search" placeholder="Search">
    </div>

    <div id="toc">
                    <ul id="tocify-header-introduction" class="tocify-header">
                <li class="tocify-item level-1" data-unique="introduction">
                    <a href="#introduction">Introduction</a>
                </li>
                            </ul>
                    <ul id="tocify-header-authenticating-requests" class="tocify-header">
                <li class="tocify-item level-1" data-unique="authenticating-requests">
                    <a href="#authenticating-requests">Authenticating requests</a>
                </li>
                            </ul>
                    <ul id="tocify-header-authentication" class="tocify-header">
                <li class="tocify-item level-1" data-unique="authentication">
                    <a href="#authentication">Authentication</a>
                </li>
                                    <ul id="tocify-subheader-authentication" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="authentication-POSTapi-v1-auth-login">
                                <a href="#authentication-POSTapi-v1-auth-login">Log in</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="authentication-POSTapi-v1-auth-refresh">
                                <a href="#authentication-POSTapi-v1-auth-refresh">Refresh the token</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="authentication-POSTapi-v1-auth-logout">
                                <a href="#authentication-POSTapi-v1-auth-logout">Log out</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="authentication-GETapi-v1-auth-me">
                                <a href="#authentication-GETapi-v1-auth-me">Current user</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="authentication-PUTapi-v1-auth-password">
                                <a href="#authentication-PUTapi-v1-auth-password">Change my password</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-baskets" class="tocify-header">
                <li class="tocify-item level-1" data-unique="baskets">
                    <a href="#baskets">Baskets</a>
                </li>
                                    <ul id="tocify-subheader-baskets" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="baskets-GETapi-v1-baskets-available">
                                <a href="#baskets-GETapi-v1-baskets-available">List the baskets free for a new order</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="baskets-GETapi-v1-baskets">
                                <a href="#baskets-GETapi-v1-baskets">List baskets</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="baskets-POSTapi-v1-baskets">
                                <a href="#baskets-POSTapi-v1-baskets">Add baskets</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="baskets-GETapi-v1-baskets--id-">
                                <a href="#baskets-GETapi-v1-baskets--id-">Show a basket</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="baskets-PUTapi-v1-baskets--basket_id-">
                                <a href="#baskets-PUTapi-v1-baskets--basket_id-">Replace a basket's label and notes</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="baskets-PATCHapi-v1-baskets--id-">
                                <a href="#baskets-PATCHapi-v1-baskets--id-">Update a basket's label or notes</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="baskets-POSTapi-v1-baskets--basket_id--retire">
                                <a href="#baskets-POSTapi-v1-baskets--basket_id--retire">Retire a basket</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="baskets-GETapi-v1-baskets--basket_id--history">
                                <a href="#baskets-GETapi-v1-baskets--basket_id--history">A basket's history</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="baskets-GETapi-v1-scan--code-">
                                <a href="#baskets-GETapi-v1-scan--code-">Look up a scanned or typed code</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-customer-portal" class="tocify-header">
                <li class="tocify-item level-1" data-unique="customer-portal">
                    <a href="#customer-portal">Customer portal</a>
                </li>
                                    <ul id="tocify-subheader-customer-portal" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="customer-portal-PATCHapi-v1-customer-account">
                                <a href="#customer-portal-PATCHapi-v1-customer-account">Update my details</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customer-portal-GETapi-v1-customer-orders">
                                <a href="#customer-portal-GETapi-v1-customer-orders">My orders</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customer-portal-GETapi-v1-customer-orders--orderNumber-">
                                <a href="#customer-portal-GETapi-v1-customer-orders--orderNumber-">One of my orders</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customer-portal-GETapi-v1-customer-notifications">
                                <a href="#customer-portal-GETapi-v1-customer-notifications">My notifications</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customer-portal-POSTapi-v1-customer-notifications--notification--read">
                                <a href="#customer-portal-POSTapi-v1-customer-notifications--notification--read">Mark one of my notifications as read</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-customer-portal-authentication" class="tocify-header">
                <li class="tocify-item level-1" data-unique="customer-portal-authentication">
                    <a href="#customer-portal-authentication">Customer portal: authentication</a>
                </li>
                                    <ul id="tocify-subheader-customer-portal-authentication" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="customer-portal-authentication-POSTapi-v1-customer-auth-register">
                                <a href="#customer-portal-authentication-POSTapi-v1-customer-auth-register">Register</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customer-portal-authentication-POSTapi-v1-customer-auth-login">
                                <a href="#customer-portal-authentication-POSTapi-v1-customer-auth-login">Log in</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customer-portal-authentication-POSTapi-v1-customer-auth-refresh">
                                <a href="#customer-portal-authentication-POSTapi-v1-customer-auth-refresh">Refresh the token</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customer-portal-authentication-GETapi-v1-customer-auth-me">
                                <a href="#customer-portal-authentication-GETapi-v1-customer-auth-me">Current customer</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customer-portal-authentication-POSTapi-v1-customer-auth-logout">
                                <a href="#customer-portal-authentication-POSTapi-v1-customer-auth-logout">Log out</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customer-portal-authentication-PUTapi-v1-customer-account-password">
                                <a href="#customer-portal-authentication-PUTapi-v1-customer-account-password">Change my password</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-customers" class="tocify-header">
                <li class="tocify-item level-1" data-unique="customers">
                    <a href="#customers">Customers</a>
                </li>
                                    <ul id="tocify-subheader-customers" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="customers-GETapi-v1-customer-barangays">
                                <a href="#customers-GETapi-v1-customer-barangays">List barangays</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customers-GETapi-v1-barangays">
                                <a href="#customers-GETapi-v1-barangays">List barangays</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customers-GETapi-v1-customers">
                                <a href="#customers-GETapi-v1-customers">List customers</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customers-POSTapi-v1-customers">
                                <a href="#customers-POSTapi-v1-customers">Register a customer at the counter</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customers-GETapi-v1-customers--id-">
                                <a href="#customers-GETapi-v1-customers--id-">Show a customer</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customers-PUTapi-v1-customers--customer_id-">
                                <a href="#customers-PUTapi-v1-customers--customer_id-">Replace a customer's profile (every field)</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customers-PATCHapi-v1-customers--id-">
                                <a href="#customers-PATCHapi-v1-customers--id-">Update a customer's profile (fields sent)</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customers-GETapi-v1-customers--customer_id--orders">
                                <a href="#customers-GETapi-v1-customers--customer_id--orders">List a customer's orders</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customers-POSTapi-v1-customers--customer_id--account">
                                <a href="#customers-POSTapi-v1-customers--customer_id--account">Create an account for a legacy profile</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customers-PATCHapi-v1-customers--customer_id--account">
                                <a href="#customers-PATCHapi-v1-customers--customer_id--account">Enable or disable sign-in</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="customers-POSTapi-v1-customers--customer_id--reset-password">
                                <a href="#customers-POSTapi-v1-customers--customer_id--reset-password">Reset the customer's password</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-dashboard" class="tocify-header">
                <li class="tocify-item level-1" data-unique="dashboard">
                    <a href="#dashboard">Dashboard</a>
                </li>
                                    <ul id="tocify-subheader-dashboard" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="dashboard-GETapi-v1-dashboard-summary">
                                <a href="#dashboard-GETapi-v1-dashboard-summary">Today at a glance</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="dashboard-GETapi-v1-analytics-dashboard">
                                <a href="#dashboard-GETapi-v1-analytics-dashboard">Dashboard analytics</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-health" class="tocify-header">
                <li class="tocify-item level-1" data-unique="health">
                    <a href="#health">Health</a>
                </li>
                                    <ul id="tocify-subheader-health" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="health-GETapi-v1-health">
                                <a href="#health-GETapi-v1-health">Check the API</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-inventory" class="tocify-header">
                <li class="tocify-item level-1" data-unique="inventory">
                    <a href="#inventory">Inventory</a>
                </li>
                                    <ul id="tocify-subheader-inventory" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="inventory-GETapi-v1-inventory-units">
                                <a href="#inventory-GETapi-v1-inventory-units">List units</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="inventory-GETapi-v1-inventory-items">
                                <a href="#inventory-GETapi-v1-inventory-items">List supply items</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="inventory-POSTapi-v1-inventory-items">
                                <a href="#inventory-POSTapi-v1-inventory-items">Add a supply item</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="inventory-GETapi-v1-inventory-items--id-">
                                <a href="#inventory-GETapi-v1-inventory-items--id-">Show a supply item</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="inventory-PUTapi-v1-inventory-items--item_id-">
                                <a href="#inventory-PUTapi-v1-inventory-items--item_id-">Replace a supply item (every field)</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="inventory-PATCHapi-v1-inventory-items--id-">
                                <a href="#inventory-PATCHapi-v1-inventory-items--id-">Update a supply item (fields sent)</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="inventory-GETapi-v1-inventory-movements">
                                <a href="#inventory-GETapi-v1-inventory-movements">List stock movements</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="inventory-POSTapi-v1-inventory-movements">
                                <a href="#inventory-POSTapi-v1-inventory-movements">Record a stock movement</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-notifications" class="tocify-header">
                <li class="tocify-item level-1" data-unique="notifications">
                    <a href="#notifications">Notifications</a>
                </li>
                                    <ul id="tocify-subheader-notifications" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="notifications-GETapi-v1-notifications">
                                <a href="#notifications-GETapi-v1-notifications">List staff notifications</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="notifications-POSTapi-v1-notifications--notification_id--read">
                                <a href="#notifications-POSTapi-v1-notifications--notification_id--read">Mark a notification as read</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-orders" class="tocify-header">
                <li class="tocify-item level-1" data-unique="orders">
                    <a href="#orders">Orders</a>
                </li>
                                    <ul id="tocify-subheader-orders" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="orders-GETapi-v1-orders">
                                <a href="#orders-GETapi-v1-orders">List orders</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="orders-POSTapi-v1-orders">
                                <a href="#orders-POSTapi-v1-orders">Take in an order</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="orders-GETapi-v1-orders--id-">
                                <a href="#orders-GETapi-v1-orders--id-">Show an order</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="orders-PUTapi-v1-orders--order_id-">
                                <a href="#orders-PUTapi-v1-orders--order_id-">Replace the notes and promised time (both required)</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="orders-PATCHapi-v1-orders--id-">
                                <a href="#orders-PATCHapi-v1-orders--id-">Update the notes or the promised time</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="orders-POSTapi-v1-orders--order_id--status">
                                <a href="#orders-POSTapi-v1-orders--order_id--status">Move an order to another stage</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-payments" class="tocify-header">
                <li class="tocify-item level-1" data-unique="payments">
                    <a href="#payments">Payments</a>
                </li>
                                    <ul id="tocify-subheader-payments" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="payments-POSTapi-v1-orders--order_id--payments">
                                <a href="#payments-POSTapi-v1-orders--order_id--payments">Record a payment on an order</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="payments-GETapi-v1-payments">
                                <a href="#payments-GETapi-v1-payments">List payments</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="payments-GETapi-v1-payments--id-">
                                <a href="#payments-GETapi-v1-payments--id-">Show a payment</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="payments-POSTapi-v1-payments--payment_id--void">
                                <a href="#payments-POSTapi-v1-payments--payment_id--void">Void a payment</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="payments-GETapi-v1-balances">
                                <a href="#payments-GETapi-v1-balances">List unpaid balances</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-reports" class="tocify-header">
                <li class="tocify-item level-1" data-unique="reports">
                    <a href="#reports">Reports</a>
                </li>
                                    <ul id="tocify-subheader-reports" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="reports-GETapi-v1-reports--kind-">
                                <a href="#reports-GETapi-v1-reports--kind-">A report</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-services" class="tocify-header">
                <li class="tocify-item level-1" data-unique="services">
                    <a href="#services">Services</a>
                </li>
                                    <ul id="tocify-subheader-services" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="services-GETapi-v1-services">
                                <a href="#services-GETapi-v1-services">List services</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="services-POSTapi-v1-services">
                                <a href="#services-POSTapi-v1-services">Add a service</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="services-GETapi-v1-services--id-">
                                <a href="#services-GETapi-v1-services--id-">Show a service</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="services-PUTapi-v1-services--service_id-">
                                <a href="#services-PUTapi-v1-services--service_id-">Replace a service (every field)</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="services-PATCHapi-v1-services--id-">
                                <a href="#services-PATCHapi-v1-services--id-">Update a service (fields sent)</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-settings" class="tocify-header">
                <li class="tocify-item level-1" data-unique="settings">
                    <a href="#settings">Settings</a>
                </li>
                                    <ul id="tocify-subheader-settings" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="settings-GETapi-v1-settings-shop">
                                <a href="#settings-GETapi-v1-settings-shop">Shop profile</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="settings-PUTapi-v1-settings-shop">
                                <a href="#settings-PUTapi-v1-settings-shop">Replace the shop profile</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="settings-PUTapi-v1-settings-stock-rule">
                                <a href="#settings-PUTapi-v1-settings-stock-rule">Set the soap stock rule</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="settings-GETapi-v1-activity-logs">
                                <a href="#settings-GETapi-v1-activity-logs">Activity log</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-users" class="tocify-header">
                <li class="tocify-item level-1" data-unique="users">
                    <a href="#users">Users</a>
                </li>
                                    <ul id="tocify-subheader-users" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="users-GETapi-v1-users">
                                <a href="#users-GETapi-v1-users">List staff users</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="users-POSTapi-v1-users">
                                <a href="#users-POSTapi-v1-users">Add a staff user</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="users-GETapi-v1-users--id-">
                                <a href="#users-GETapi-v1-users--id-">Show a staff user</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="users-PUTapi-v1-users--user_id-">
                                <a href="#users-PUTapi-v1-users--user_id-">Replace a staff user (name, username and role)</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="users-PATCHapi-v1-users--id-">
                                <a href="#users-PATCHapi-v1-users--id-">Update a staff user (fields sent; isActive true re-enables)</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="users-POSTapi-v1-users--user_id--disable">
                                <a href="#users-POSTapi-v1-users--user_id--disable">Disable a staff user</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="users-POSTapi-v1-users--user_id--reset-password">
                                <a href="#users-POSTapi-v1-users--user_id--reset-password">Reset a staff user's password</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="users-GETapi-v1-roles-permissions">
                                <a href="#users-GETapi-v1-roles-permissions">Staff permissions</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="users-PUTapi-v1-roles-staff-permissions">
                                <a href="#users-PUTapi-v1-roles-staff-permissions">Replace the staff permissions</a>
                            </li>
                                                                        </ul>
                            </ul>
                    <ul id="tocify-header-wash-types" class="tocify-header">
                <li class="tocify-item level-1" data-unique="wash-types">
                    <a href="#wash-types">Wash types</a>
                </li>
                                    <ul id="tocify-subheader-wash-types" class="tocify-subheader">
                                                    <li class="tocify-item level-2" data-unique="wash-types-GETapi-v1-wash-types">
                                <a href="#wash-types-GETapi-v1-wash-types">List wash types</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="wash-types-POSTapi-v1-wash-types">
                                <a href="#wash-types-POSTapi-v1-wash-types">Add a wash type</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="wash-types-GETapi-v1-wash-types--washType_id-">
                                <a href="#wash-types-GETapi-v1-wash-types--washType_id-">Show a wash type</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="wash-types-PUTapi-v1-wash-types--washType_id-">
                                <a href="#wash-types-PUTapi-v1-wash-types--washType_id-">Replace a wash type (fields sent; `supplies` replaces the whole list)</a>
                            </li>
                                                                                <li class="tocify-item level-2" data-unique="wash-types-PATCHapi-v1-wash-types--washType_id-">
                                <a href="#wash-types-PATCHapi-v1-wash-types--washType_id-">Update a wash type (fields sent)</a>
                            </li>
                                                                        </ul>
                            </ul>
            </div>

    <ul class="toc-footer" id="toc-footer">
                    <li style="padding-bottom: 5px;"><a href="{{ route("scribe.postman") }}">View Postman collection</a></li>
                            <li style="padding-bottom: 5px;"><a href="{{ route("scribe.openapi") }}">View OpenAPI spec</a></li>
                <li><a href="http://github.com/knuckleswtf/scribe">Documentation powered by Scribe ✍</a></li>
    </ul>

    <ul class="toc-footer" id="last-updated">
        <li>Last updated: November 20, 2026</li>
    </ul>
</div>

<div class="page-wrapper">
    <div class="dark-box"></div>
    <div class="content">
        <h1 id="introduction">Introduction</h1>
<p>The REST API of LaundryFlow, the laundry shop management and QR basket tracking system: staff (JWT, api guard) and the customer portal (JWT, customer guard). Built following the course API Master Class in Laravel: versioned at /api/v1, JSON:API-style resources, course error format.</p>
<aside>
    <strong>Base URL</strong>: <code>http://localhost:8000</code>
</aside>
<pre><code>This documentation aims to provide all the information you need to work with our API.

&lt;aside&gt;As you scroll, you'll see code examples for working with the API in different programming languages in the dark area to the right (or as part of the content on mobile).
You can switch the language used with the tabs at the top right (or from the nav menu at the top left on mobile).&lt;/aside&gt;</code></pre>

        <h1 id="authenticating-requests">Authenticating requests</h1>
<p>To authenticate requests, include an <strong><code>Authorization</code></strong> header with the value <strong><code>"Bearer {YOUR_AUTH_KEY}"</code></strong>.</p>
<p>All authenticated endpoints are marked with a <code>requires authentication</code> badge in the documentation below.</p>
<p>Log in with <code>POST /api/v1/auth/login</code> (staff: <code>liza.ramos</code> / <code>password123</code>) or <code>POST /api/v1/customer/auth/login</code> (customers), and paste the <code>access_token</code> here. Send it as <code>Authorization: Bearer {token}</code>. Tokens last JWT_TTL minutes; exchange an expired one with <code>/auth/refresh</code>.</p>

        <h1 id="authentication">Authentication</h1>

    <p>Staff sign-in with JWT (course L8): log in, read the current user, refresh and log out.
Staff accounts are created by the owner in Settings, so there is no public registration.</p>

                                <h2 id="authentication-POSTapi-v1-auth-login">Log in</h2>

<p>
</p>

<p>Returns an access token. Send it as a Bearer token on every other request. Five failed
attempts a minute for the same username and IP answer 429.</p>

<span id="example-requests-POSTapi-v1-auth-login">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/auth/login" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"username\": \"liza.ramos\",
    \"password\": \"password123\",
    \"remember\": false
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/auth/login"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "username": "liza.ramos",
    "password": "password123",
    "remember": false
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-auth-login">
</span>
<span id="execution-results-POSTapi-v1-auth-login" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-auth-login"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-auth-login"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-auth-login" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-auth-login">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-auth-login" data-method="POST"
      data-path="api/v1/auth/login"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-auth-login', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-auth-login"
                    onclick="tryItOut('POSTapi-v1-auth-login');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-auth-login"
                    onclick="cancelTryOut('POSTapi-v1-auth-login');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-auth-login"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/auth/login</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-auth-login"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-auth-login"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>username</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="username"                data-endpoint="POSTapi-v1-auth-login"
               value="liza.ramos"
               data-component="body">
    <br>
<p>The staff username. Must not be greater than 50 characters. Example: <code>liza.ramos</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>password</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="password"                data-endpoint="POSTapi-v1-auth-login"
               value="password123"
               data-component="body">
    <br>
<p>The password. Example: <code>password123</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>remember</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="POSTapi-v1-auth-login" style="display: none">
            <input type="radio" name="remember"
                   value="true"
                   data-endpoint="POSTapi-v1-auth-login"
                   data-component="body"             >
            <code>true</code>
        </label>
        <label data-endpoint="POSTapi-v1-auth-login" style="display: none">
            <input type="radio" name="remember"
                   value="false"
                   data-endpoint="POSTapi-v1-auth-login"
                   data-component="body"             >
            <code>false</code>
        </label>
    <br>
<p>Kept for the sign-in form; tokens are refreshed instead. Example: <code>false</code></p>
        </div>
        </form>

                    <h2 id="authentication-POSTapi-v1-auth-refresh">Refresh the token</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Blacklists the current token (an expired one is accepted within JWT_REFRESH_TTL) and returns
a new one carrying the user's current abilities.</p>

<span id="example-requests-POSTapi-v1-auth-refresh">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/auth/refresh" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/auth/refresh"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "POST",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-auth-refresh">
</span>
<span id="execution-results-POSTapi-v1-auth-refresh" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-auth-refresh"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-auth-refresh"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-auth-refresh" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-auth-refresh">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-auth-refresh" data-method="POST"
      data-path="api/v1/auth/refresh"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-auth-refresh', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-auth-refresh"
                    onclick="tryItOut('POSTapi-v1-auth-refresh');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-auth-refresh"
                    onclick="cancelTryOut('POSTapi-v1-auth-refresh');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-auth-refresh"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/auth/refresh</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-auth-refresh"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-auth-refresh"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-auth-refresh"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="authentication-POSTapi-v1-auth-logout">Log out</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Blacklists the current token so it can never be used again.</p>

<span id="example-requests-POSTapi-v1-auth-logout">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/auth/logout" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/auth/logout"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "POST",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-auth-logout">
</span>
<span id="execution-results-POSTapi-v1-auth-logout" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-auth-logout"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-auth-logout"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-auth-logout" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-auth-logout">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-auth-logout" data-method="POST"
      data-path="api/v1/auth/logout"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-auth-logout', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-auth-logout"
                    onclick="tryItOut('POSTapi-v1-auth-logout');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-auth-logout"
                    onclick="cancelTryOut('POSTapi-v1-auth-logout');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-auth-logout"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/auth/logout</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-auth-logout"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-auth-logout"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-auth-logout"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="authentication-GETapi-v1-auth-me">Current user</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Returns the staff member who owns the Bearer token, with their role and permissions.</p>

<span id="example-requests-GETapi-v1-auth-me">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/auth/me" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/auth/me"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-auth-me">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-auth-me" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-auth-me"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-auth-me"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-auth-me" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-auth-me">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-auth-me" data-method="GET"
      data-path="api/v1/auth/me"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-auth-me', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-auth-me"
                    onclick="tryItOut('GETapi-v1-auth-me');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-auth-me"
                    onclick="cancelTryOut('GETapi-v1-auth-me');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-auth-me"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/auth/me</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-auth-me"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-auth-me"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-auth-me"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="authentication-PUTapi-v1-auth-password">Change my password</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Also allowed while a password change is pending.</p>

<span id="example-requests-PUTapi-v1-auth-password">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/v1/auth/password" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"current_password\": \"k7m2p9qx4t\",
    \"password\": \"laundry2026\",
    \"password_confirmation\": \"laundry2026\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/auth/password"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "current_password": "k7m2p9qx4t",
    "password": "laundry2026",
    "password_confirmation": "laundry2026"
};

fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-v1-auth-password">
</span>
<span id="execution-results-PUTapi-v1-auth-password" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-v1-auth-password"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-v1-auth-password"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-v1-auth-password" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-v1-auth-password">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-v1-auth-password" data-method="PUT"
      data-path="api/v1/auth/password"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-v1-auth-password', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-v1-auth-password"
                    onclick="tryItOut('PUTapi-v1-auth-password');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-v1-auth-password"
                    onclick="cancelTryOut('PUTapi-v1-auth-password');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-v1-auth-password"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/v1/auth/password</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PUTapi-v1-auth-password"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-v1-auth-password"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-v1-auth-password"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>current_password</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="current_password"                data-endpoint="PUTapi-v1-auth-password"
               value="k7m2p9qx4t"
               data-component="body">
    <br>
<p>The current password, or the temporary one the owner or shop gave. Example: <code>k7m2p9qx4t</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>password</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="password"                data-endpoint="PUTapi-v1-auth-password"
               value="laundry2026"
               data-component="body">
    <br>
<p>At least 8 characters, with a letter and a number, different from the current one. Example: <code>laundry2026</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>password_confirmation</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="password_confirmation"                data-endpoint="PUTapi-v1-auth-password"
               value="laundry2026"
               data-component="body">
    <br>
<p>The new password again. The value and <code>password</code> must match. Example: <code>laundry2026</code></p>
        </div>
        </form>

                <h1 id="baskets">Baskets</h1>

    <p>The reusable QR baskets. Each label is permanent; a lost basket is retired, never deleted.</p>

                                <h2 id="baskets-GETapi-v1-baskets-available">List the baskets free for a new order</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-v1-baskets-available">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/baskets/available" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/baskets/available"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-baskets-available">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-baskets-available" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-baskets-available"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-baskets-available"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-baskets-available" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-baskets-available">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-baskets-available" data-method="GET"
      data-path="api/v1/baskets/available"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-baskets-available', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-baskets-available"
                    onclick="tryItOut('GETapi-v1-baskets-available');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-baskets-available"
                    onclick="cancelTryOut('GETapi-v1-baskets-available');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-baskets-available"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/baskets/available</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-baskets-available"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-baskets-available"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-baskets-available"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="baskets-GETapi-v1-baskets">List baskets</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>By number. <code>meta.counts</code> has the number of baskets in each status.</p>

<span id="example-requests-GETapi-v1-baskets">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/baskets?status=available&amp;search=0007&amp;sort=basketNumber&amp;page=1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/baskets"
);

const params = {
    "status": "available",
    "search": "0007",
    "sort": "basketNumber",
    "page": "1",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-baskets">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-baskets" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-baskets"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-baskets"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-baskets" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-baskets">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-baskets" data-method="GET"
      data-path="api/v1/baskets"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-baskets', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-baskets"
                    onclick="tryItOut('GETapi-v1-baskets');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-baskets"
                    onclick="cancelTryOut('GETapi-v1-baskets');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-baskets"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/baskets</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-baskets"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-baskets"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-baskets"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>status</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="status"                data-endpoint="GETapi-v1-baskets"
               value="available"
               data-component="query">
    <br>
<p>available, in_use or retired. Example: <code>available</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>search</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="search"                data-endpoint="GETapi-v1-baskets"
               value="0007"
               data-component="query">
    <br>
<p>Basket number, label or the order it holds. Example: <code>0007</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>sort</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="sort"                data-endpoint="GETapi-v1-baskets"
               value="basketNumber"
               data-component="query">
    <br>
<p>basketNumber, status or createdAt. Example: <code>basketNumber</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>page</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="page"                data-endpoint="GETapi-v1-baskets"
               value="1"
               data-component="query">
    <br>
<p>The page number. Example: <code>1</code></p>
            </div>
                </form>

                    <h2 id="baskets-POSTapi-v1-baskets">Add baskets</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>1 to 100 at a time. Numbers continue after the highest ever issued; each basket gets its own
permanent 32-character QR token.</p>

<span id="example-requests-POSTapi-v1-baskets">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/baskets" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"count\": 10,
            \"label\": \"Blue, large\"
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/baskets"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "count": 10,
            "label": "Blue, large"
        }
    }
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-baskets">
</span>
<span id="execution-results-POSTapi-v1-baskets" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-baskets"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-baskets"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-baskets" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-baskets">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-baskets" data-method="POST"
      data-path="api/v1/baskets"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-baskets', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-baskets"
                    onclick="tryItOut('POSTapi-v1-baskets');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-baskets"
                    onclick="cancelTryOut('POSTapi-v1-baskets');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-baskets"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/baskets</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-baskets"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-baskets"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-baskets"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>count</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.count"                data-endpoint="POSTapi-v1-baskets"
               value="10"
               data-component="body">
    <br>
<p>How many baskets to add (1–100). Must be at least 1. Must not be greater than 100. Example: <code>10</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>label</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.label"                data-endpoint="POSTapi-v1-baskets"
               value="Blue, large"
               data-component="body">
    <br>
<p>A label for all of them. Must not be greater than 100 characters. Example: <code>Blue, large</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="baskets-GETapi-v1-baskets--id-">Show a basket</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-v1-baskets--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/baskets/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/baskets/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-baskets--id-">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-baskets--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-baskets--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-baskets--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-baskets--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-baskets--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-baskets--id-" data-method="GET"
      data-path="api/v1/baskets/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-baskets--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-baskets--id-"
                    onclick="tryItOut('GETapi-v1-baskets--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-baskets--id-"
                    onclick="cancelTryOut('GETapi-v1-baskets--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-baskets--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/baskets/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-baskets--id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-baskets--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-baskets--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="GETapi-v1-baskets--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the basket. Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="baskets-PUTapi-v1-baskets--basket_id-">Replace a basket&#039;s label and notes</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PUTapi-v1-baskets--basket_id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/v1/baskets/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"label\": \"Green, large\",
            \"notes\": \"Handle taped\"
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/baskets/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "label": "Green, large",
            "notes": "Handle taped"
        }
    }
};

fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-v1-baskets--basket_id-">
</span>
<span id="execution-results-PUTapi-v1-baskets--basket_id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-v1-baskets--basket_id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-v1-baskets--basket_id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-v1-baskets--basket_id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-v1-baskets--basket_id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-v1-baskets--basket_id-" data-method="PUT"
      data-path="api/v1/baskets/{basket_id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-v1-baskets--basket_id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-v1-baskets--basket_id-"
                    onclick="tryItOut('PUTapi-v1-baskets--basket_id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-v1-baskets--basket_id-"
                    onclick="cancelTryOut('PUTapi-v1-baskets--basket_id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-v1-baskets--basket_id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/v1/baskets/{basket_id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PUTapi-v1-baskets--basket_id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-v1-baskets--basket_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-v1-baskets--basket_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>basket_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="basket_id"                data-endpoint="PUTapi-v1-baskets--basket_id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the basket. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>label</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.label"                data-endpoint="PUTapi-v1-baskets--basket_id-"
               value="Green, large"
               data-component="body">
    <br>
<p>Must not be greater than 100 characters. Example: <code>Green, large</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>notes</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.notes"                data-endpoint="PUTapi-v1-baskets--basket_id-"
               value="Handle taped"
               data-component="body">
    <br>
<p>Must not be greater than 255 characters. Example: <code>Handle taped</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="baskets-PATCHapi-v1-baskets--id-">Update a basket&#039;s label or notes</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PATCHapi-v1-baskets--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PATCH \
    "http://localhost:8000/api/v1/baskets/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"label\": \"Green, large\",
            \"notes\": \"Handle taped\"
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/baskets/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "label": "Green, large",
            "notes": "Handle taped"
        }
    }
};

fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PATCHapi-v1-baskets--id-">
</span>
<span id="execution-results-PATCHapi-v1-baskets--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PATCHapi-v1-baskets--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PATCHapi-v1-baskets--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PATCHapi-v1-baskets--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PATCHapi-v1-baskets--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PATCHapi-v1-baskets--id-" data-method="PATCH"
      data-path="api/v1/baskets/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PATCHapi-v1-baskets--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PATCHapi-v1-baskets--id-"
                    onclick="tryItOut('PATCHapi-v1-baskets--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PATCHapi-v1-baskets--id-"
                    onclick="cancelTryOut('PATCHapi-v1-baskets--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PATCHapi-v1-baskets--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/v1/baskets/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PATCHapi-v1-baskets--id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PATCHapi-v1-baskets--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PATCHapi-v1-baskets--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="PATCHapi-v1-baskets--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the basket. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>label</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.label"                data-endpoint="PATCHapi-v1-baskets--id-"
               value="Green, large"
               data-component="body">
    <br>
<p>Must not be greater than 100 characters. Example: <code>Green, large</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>notes</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.notes"                data-endpoint="PATCHapi-v1-baskets--id-"
               value="Handle taped"
               data-component="body">
    <br>
<p>Must not be greater than 255 characters. Example: <code>Handle taped</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="baskets-POSTapi-v1-baskets--basket_id--retire">Retire a basket</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>For a lost or broken basket: kept with its history, its number never reused.
409 while it holds an order or when already retired.</p>

<span id="example-requests-POSTapi-v1-baskets--basket_id--retire">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/baskets/1/retire" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/baskets/1/retire"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "POST",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-baskets--basket_id--retire">
</span>
<span id="execution-results-POSTapi-v1-baskets--basket_id--retire" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-baskets--basket_id--retire"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-baskets--basket_id--retire"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-baskets--basket_id--retire" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-baskets--basket_id--retire">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-baskets--basket_id--retire" data-method="POST"
      data-path="api/v1/baskets/{basket_id}/retire"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-baskets--basket_id--retire', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-baskets--basket_id--retire"
                    onclick="tryItOut('POSTapi-v1-baskets--basket_id--retire');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-baskets--basket_id--retire"
                    onclick="cancelTryOut('POSTapi-v1-baskets--basket_id--retire');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-baskets--basket_id--retire"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/baskets/{basket_id}/retire</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-baskets--basket_id--retire"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-baskets--basket_id--retire"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-baskets--basket_id--retire"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>basket_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="basket_id"                data-endpoint="POSTapi-v1-baskets--basket_id--retire"
               value="1"
               data-component="url">
    <br>
<p>The ID of the basket. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>reason</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.reason"                data-endpoint="POSTapi-v1-baskets--basket_id--retire"
               value="Cracked handle, replaced"
               data-component="body">
    <br>
<p>Why it is retired. Example: <code>Cracked handle, replaced</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="baskets-GETapi-v1-baskets--basket_id--history">A basket&#039;s history</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Every order it held, newest first, 10 per page.</p>

<span id="example-requests-GETapi-v1-baskets--basket_id--history">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/baskets/1/history" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/baskets/1/history"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-baskets--basket_id--history">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-baskets--basket_id--history" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-baskets--basket_id--history"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-baskets--basket_id--history"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-baskets--basket_id--history" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-baskets--basket_id--history">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-baskets--basket_id--history" data-method="GET"
      data-path="api/v1/baskets/{basket_id}/history"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-baskets--basket_id--history', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-baskets--basket_id--history"
                    onclick="tryItOut('GETapi-v1-baskets--basket_id--history');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-baskets--basket_id--history"
                    onclick="cancelTryOut('GETapi-v1-baskets--basket_id--history');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-baskets--basket_id--history"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/baskets/{basket_id}/history</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-baskets--basket_id--history"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-baskets--basket_id--history"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-baskets--basket_id--history"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>basket_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="basket_id"                data-endpoint="GETapi-v1-baskets--basket_id--history"
               value="1"
               data-component="url">
    <br>
<p>The ID of the basket. Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="baskets-GETapi-v1-scan--code-">Look up a scanned or typed code</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p><code>code</code> is a basket label URL (…/b/{token}), a bare token, a basket number (BSK-0007) or an
order number (LF-261108-0001). A basket answers with its active order (or null when it is
available, retired, or its last order is completed); an order number answers with the order.</p>

<span id="example-requests-GETapi-v1-scan--code-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/scan/BSK-0007" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/scan/BSK-0007"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-scan--code-">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-scan--code-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-scan--code-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-scan--code-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-scan--code-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-scan--code-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-scan--code-" data-method="GET"
      data-path="api/v1/scan/{code}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-scan--code-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-scan--code-"
                    onclick="tryItOut('GETapi-v1-scan--code-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-scan--code-"
                    onclick="cancelTryOut('GETapi-v1-scan--code-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-scan--code-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/scan/{code}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-scan--code-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-scan--code-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-scan--code-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>code</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="code"                data-endpoint="GETapi-v1-scan--code-"
               value="BSK-0007"
               data-component="url">
    <br>
<p>The scanned text. Example: <code>BSK-0007</code></p>
            </div>
                    </form>

                <h1 id="customer-portal">Customer portal</h1>

    <p>The signed-in customer's own orders. Every query is scoped to that customer: another
customer's order answers 404, exactly like one that does not exist, so numbers cannot be probed.</p>

                                <h2 id="customer-portal-PATCHapi-v1-customer-account">Update my details</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Only the phone number, barangay and street address. The name, email and the shop's notes
stay with the shop.</p>

<span id="example-requests-PATCHapi-v1-customer-account">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PATCH \
    "http://localhost:8000/api/v1/customer/account" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"contactNumber\": \"0917 845 2210\",
            \"streetAddress\": \"Purok 2\"
        },
        \"relationships\": {
            \"barangay\": {
                \"data\": {
                    \"id\": 28
                }
            }
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customer/account"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "contactNumber": "0917 845 2210",
            "streetAddress": "Purok 2"
        },
        "relationships": {
            "barangay": {
                "data": {
                    "id": 28
                }
            }
        }
    }
};

fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PATCHapi-v1-customer-account">
</span>
<span id="execution-results-PATCHapi-v1-customer-account" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PATCHapi-v1-customer-account"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PATCHapi-v1-customer-account"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PATCHapi-v1-customer-account" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PATCHapi-v1-customer-account">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PATCHapi-v1-customer-account" data-method="PATCH"
      data-path="api/v1/customer/account"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PATCHapi-v1-customer-account', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PATCHapi-v1-customer-account"
                    onclick="tryItOut('PATCHapi-v1-customer-account');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PATCHapi-v1-customer-account"
                    onclick="cancelTryOut('PATCHapi-v1-customer-account');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PATCHapi-v1-customer-account"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/v1/customer/account</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PATCHapi-v1-customer-account"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PATCHapi-v1-customer-account"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PATCHapi-v1-customer-account"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>contactNumber</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.contactNumber"                data-endpoint="PATCHapi-v1-customer-account"
               value="0917 845 2210"
               data-component="body">
    <br>
<p>Example: <code>0917 845 2210</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>streetAddress</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.streetAddress"                data-endpoint="PATCHapi-v1-customer-account"
               value="Purok 2"
               data-component="body">
    <br>
<p>Example: <code>Purok 2</code></p>
                    </div>
                                    </details>
        </div>
                                                                    <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>relationships</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 28px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>barangay</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 42px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 56px; clear: unset;">
                        <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.relationships.barangay.data.id"                data-endpoint="PATCHapi-v1-customer-account"
               value="28"
               data-component="body">
    <br>
<p>Example: <code>28</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="customer-portal-GETapi-v1-customer-orders">My orders</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Newest first. <code>meta.active</code> and <code>meta.completed</code> count the customer's orders.</p>

<span id="example-requests-GETapi-v1-customer-orders">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/customer/orders?status=active" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customer/orders"
);

const params = {
    "status": "active",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-customer-orders">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: [
        {
            &quot;type&quot;: &quot;portalOrder&quot;,
            &quot;id&quot;: &quot;LF-261110-0009&quot;,
            &quot;attributes&quot;: {
                &quot;orderNumber&quot;: &quot;LF-261110-0009&quot;,
                &quot;receivedAt&quot;: &quot;2026-11-10T01:20:00.000Z&quot;,
                &quot;promisedAt&quot;: &quot;2026-11-11T02:00:00.000Z&quot;,
                &quot;releasedAt&quot;: null,
                &quot;status&quot;: &quot;washing&quot;,
                &quot;statusLabel&quot;: &quot;Washing&quot;,
                &quot;totalCents&quot;: 36750,
                &quot;paidCents&quot;: 20000,
                &quot;balanceCents&quot;: 16750,
                &quot;paymentStatus&quot;: &quot;partial&quot;
            },
            &quot;links&quot;: {
                &quot;self&quot;: &quot;http://laundryflow.test/api/v1/customer/orders/LF-261110-0009&quot;
            },
            &quot;includes&quot;: {
                &quot;baskets&quot;: [
                    {
                        &quot;type&quot;: &quot;basket&quot;,
                        &quot;id&quot;: 20,
                        &quot;attributes&quot;: {
                            &quot;basketNumber&quot;: &quot;BSK-0020&quot;
                        }
                    }
                ],
                &quot;items&quot;: [
                    {
                        &quot;type&quot;: &quot;orderItem&quot;,
                        &quot;id&quot;: 2170,
                        &quot;attributes&quot;: {
                            &quot;weightKg&quot;: 6.5,
                            &quot;quantity&quot;: null,
                            &quot;unitPriceCents&quot;: 3500,
                            &quot;subtotalCents&quot;: 22750,
                            &quot;serviceName&quot;: &quot;Wash-Dry-Fold&quot;,
                            &quot;pricingType&quot;: &quot;per_kg&quot;
                        }
                    }
                ]
            }
        }
    ],
    &quot;links&quot;: {
        &quot;first&quot;: &quot;http://laundryflow.test/api/v1/customer/orders?page=1&quot;,
        &quot;last&quot;: &quot;http://laundryflow.test/api/v1/customer/orders?page=4&quot;,
        &quot;prev&quot;: null,
        &quot;next&quot;: &quot;http://laundryflow.test/api/v1/customer/orders?page=2&quot;
    },
    &quot;meta&quot;: {
        &quot;current_page&quot;: 1,
        &quot;last_page&quot;: 4,
        &quot;per_page&quot;: 1,
        &quot;total&quot;: 4,
        &quot;active&quot;: 1,
        &quot;completed&quot;: 3
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-customer-orders" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-customer-orders"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-customer-orders"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-customer-orders" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-customer-orders">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-customer-orders" data-method="GET"
      data-path="api/v1/customer/orders"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-customer-orders', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-customer-orders"
                    onclick="tryItOut('GETapi-v1-customer-orders');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-customer-orders"
                    onclick="cancelTryOut('GETapi-v1-customer-orders');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-customer-orders"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/customer/orders</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-customer-orders"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-customer-orders"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-customer-orders"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>status</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="status"                data-endpoint="GETapi-v1-customer-orders"
               value="active"
               data-component="query">
    <br>
<p>active or completed. Example: <code>active</code></p>
            </div>
                </form>

                    <h2 id="customer-portal-GETapi-v1-customer-orders--orderNumber-">One of my orders</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>By its order number. No staff names, notes or voided payments. Another customer's order
number answers 404, exactly like one that does not exist.</p>

<span id="example-requests-GETapi-v1-customer-orders--orderNumber-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/customer/orders/LF-261110-0009" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customer/orders/LF-261110-0009"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-customer-orders--orderNumber-">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;type&quot;: &quot;portalOrder&quot;,
        &quot;id&quot;: &quot;LF-261110-0009&quot;,
        &quot;attributes&quot;: {
            &quot;orderNumber&quot;: &quot;LF-261110-0009&quot;,
            &quot;receivedAt&quot;: &quot;2026-11-10T01:20:00.000Z&quot;,
            &quot;promisedAt&quot;: &quot;2026-11-11T02:00:00.000Z&quot;,
            &quot;releasedAt&quot;: null,
            &quot;status&quot;: &quot;washing&quot;,
            &quot;statusLabel&quot;: &quot;Washing&quot;,
            &quot;totalCents&quot;: 36750,
            &quot;paidCents&quot;: 20000,
            &quot;balanceCents&quot;: 16750,
            &quot;paymentStatus&quot;: &quot;partial&quot;,
            &quot;customer&quot;: {
                &quot;fullName&quot;: &quot;Maria Santos&quot;,
                &quot;contactNumber&quot;: &quot;09178452210&quot;
            },
            &quot;timeline&quot;: [
                {
                    &quot;status&quot;: &quot;received&quot;,
                    &quot;label&quot;: &quot;Received&quot;,
                    &quot;at&quot;: &quot;2026-11-10T01:20:00.000Z&quot;
                },
                {
                    &quot;status&quot;: &quot;washing&quot;,
                    &quot;label&quot;: &quot;Washing&quot;,
                    &quot;at&quot;: &quot;2026-11-10T02:54:00.000Z&quot;
                },
                {
                    &quot;status&quot;: &quot;drying&quot;,
                    &quot;label&quot;: &quot;Drying&quot;,
                    &quot;at&quot;: null
                },
                {
                    &quot;status&quot;: &quot;folding&quot;,
                    &quot;label&quot;: &quot;Folding&quot;,
                    &quot;at&quot;: null
                },
                {
                    &quot;status&quot;: &quot;ready_for_pickup&quot;,
                    &quot;label&quot;: &quot;Ready for Pickup&quot;,
                    &quot;at&quot;: null
                },
                {
                    &quot;status&quot;: &quot;released&quot;,
                    &quot;label&quot;: &quot;Completed&quot;,
                    &quot;at&quot;: null
                }
            ]
        },
        &quot;links&quot;: {
            &quot;self&quot;: &quot;http://laundryflow.test/api/v1/customer/orders/LF-261110-0009&quot;
        },
        &quot;includes&quot;: {
            &quot;baskets&quot;: [
                {
                    &quot;type&quot;: &quot;basket&quot;,
                    &quot;id&quot;: 20,
                    &quot;attributes&quot;: {
                        &quot;basketNumber&quot;: &quot;BSK-0020&quot;
                    }
                }
            ],
            &quot;items&quot;: [
                {
                    &quot;type&quot;: &quot;orderItem&quot;,
                    &quot;id&quot;: 2170,
                    &quot;attributes&quot;: {
                        &quot;weightKg&quot;: 6.5,
                        &quot;quantity&quot;: null,
                        &quot;unitPriceCents&quot;: 3500,
                        &quot;subtotalCents&quot;: 22750,
                        &quot;serviceName&quot;: &quot;Wash-Dry-Fold&quot;,
                        &quot;pricingType&quot;: &quot;per_kg&quot;
                    }
                }
            ],
            &quot;payments&quot;: [
                {
                    &quot;type&quot;: &quot;payment&quot;,
                    &quot;id&quot;: 2010,
                    &quot;attributes&quot;: {
                        &quot;paidAt&quot;: &quot;2026-11-10T01:22:00.000Z&quot;,
                        &quot;methodLabel&quot;: &quot;Cash&quot;,
                        &quot;amountCents&quot;: 20000,
                        &quot;referenceNumber&quot;: null,
                        &quot;receiptNumber&quot;: &quot;OR-002210&quot;
                    }
                }
            ],
            &quot;shop&quot;: {
                &quot;type&quot;: &quot;shopSettings&quot;,
                &quot;id&quot;: 1,
                &quot;attributes&quot;: {
                    &quot;name&quot;: &quot;LaundryFlow&quot;,
                    &quot;address&quot;: &quot;Brgy. Poblacion, Bongabong, Oriental Mindoro&quot;
                }
            }
        }
    }
}</code>
 </pre>
            <blockquote>
            <p>Example response (404):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 404,
            &quot;message&quot;: &quot;The resource cannot be found.&quot;,
            &quot;source&quot;: &quot;Order&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-customer-orders--orderNumber-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-customer-orders--orderNumber-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-customer-orders--orderNumber-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-customer-orders--orderNumber-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-customer-orders--orderNumber-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-customer-orders--orderNumber-" data-method="GET"
      data-path="api/v1/customer/orders/{orderNumber}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-customer-orders--orderNumber-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-customer-orders--orderNumber-"
                    onclick="tryItOut('GETapi-v1-customer-orders--orderNumber-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-customer-orders--orderNumber-"
                    onclick="cancelTryOut('GETapi-v1-customer-orders--orderNumber-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-customer-orders--orderNumber-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/customer/orders/{orderNumber}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-customer-orders--orderNumber-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-customer-orders--orderNumber-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-customer-orders--orderNumber-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>orderNumber</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="orderNumber"                data-endpoint="GETapi-v1-customer-orders--orderNumber-"
               value="LF-261110-0009"
               data-component="url">
    <br>
<p>Example: <code>LF-261110-0009</code></p>
            </div>
                    </form>

                    <h2 id="customer-portal-GETapi-v1-customer-notifications">My notifications</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>The customer's own notices, newest first, each with its order number. <code>meta.unread</code> counts the unread ones.</p>

<span id="example-requests-GETapi-v1-customer-notifications">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/customer/notifications" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customer/notifications"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-customer-notifications">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: [
        {
            &quot;type&quot;: &quot;notification&quot;,
            &quot;id&quot;: 119,
            &quot;attributes&quot;: {
                &quot;type&quot;: &quot;status_changed&quot;,
                &quot;message&quot;: &quot;Order LF-261110-0009 is now Washing&quot;,
                &quot;sentAt&quot;: &quot;2026-11-10T02:54:00.000Z&quot;,
                &quot;readAt&quot;: null,
                &quot;orderNumber&quot;: &quot;LF-261110-0009&quot;
            },
            &quot;relationships&quot;: {
                &quot;order&quot;: {
                    &quot;data&quot;: {
                        &quot;type&quot;: &quot;order&quot;,
                        &quot;id&quot;: 1652
                    }
                },
                &quot;customer&quot;: {
                    &quot;data&quot;: {
                        &quot;type&quot;: &quot;customer&quot;,
                        &quot;id&quot;: 1
                    }
                }
            }
        }
    ],
    &quot;links&quot;: {
        &quot;first&quot;: &quot;http://laundryflow.test/api/v1/customer/notifications?page=1&quot;,
        &quot;last&quot;: &quot;http://laundryflow.test/api/v1/customer/notifications?page=1&quot;,
        &quot;prev&quot;: null,
        &quot;next&quot;: null
    },
    &quot;meta&quot;: {
        &quot;current_page&quot;: 1,
        &quot;last_page&quot;: 1,
        &quot;per_page&quot;: 20,
        &quot;total&quot;: 2,
        &quot;unread&quot;: 1
    }
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-customer-notifications" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-customer-notifications"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-customer-notifications"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-customer-notifications" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-customer-notifications">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-customer-notifications" data-method="GET"
      data-path="api/v1/customer/notifications"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-customer-notifications', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-customer-notifications"
                    onclick="tryItOut('GETapi-v1-customer-notifications');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-customer-notifications"
                    onclick="cancelTryOut('GETapi-v1-customer-notifications');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-customer-notifications"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/customer/notifications</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-customer-notifications"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-customer-notifications"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-customer-notifications"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="customer-portal-POSTapi-v1-customer-notifications--notification--read">Mark one of my notifications as read</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-POSTapi-v1-customer-notifications--notification--read">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/customer/notifications/1/read" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customer/notifications/1/read"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "POST",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-customer-notifications--notification--read">
</span>
<span id="execution-results-POSTapi-v1-customer-notifications--notification--read" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-customer-notifications--notification--read"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-customer-notifications--notification--read"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-customer-notifications--notification--read" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-customer-notifications--notification--read">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-customer-notifications--notification--read" data-method="POST"
      data-path="api/v1/customer/notifications/{notification}/read"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-customer-notifications--notification--read', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-customer-notifications--notification--read"
                    onclick="tryItOut('POSTapi-v1-customer-notifications--notification--read');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-customer-notifications--notification--read"
                    onclick="cancelTryOut('POSTapi-v1-customer-notifications--notification--read');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-customer-notifications--notification--read"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/customer/notifications/{notification}/read</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-customer-notifications--notification--read"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-customer-notifications--notification--read"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-customer-notifications--notification--read"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>notification</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="notification"                data-endpoint="POSTapi-v1-customer-notifications--notification--read"
               value="1"
               data-component="url">
    <br>
<p>The notification. Example: <code>1</code></p>
            </div>
                    </form>

                <h1 id="customer-portal-authentication">Customer portal: authentication</h1>

    <p>The customer guard (JWT), entirely separate from staff sign-in: a customer token is rejected by
every staff route, and a staff token by every customer route.</p>

                                <h2 id="customer-portal-authentication-POSTapi-v1-customer-auth-register">Register</h2>

<p>
</p>

<p>Creates the customer profile and its account in one transaction and signs the customer in.</p>

<span id="example-requests-POSTapi-v1-customer-auth-register">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/customer/auth/register" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"full_name\": \"Juan Dela Cruz\",
    \"contact_number\": \"0917 555 0101\",
    \"email\": \"juan.delacruz@example.com\",
    \"password\": \"laundry123\",
    \"password_confirmation\": \"laundry123\",
    \"barangay_id\": 28,
    \"street_address\": \"Purok 3\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customer/auth/register"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "full_name": "Juan Dela Cruz",
    "contact_number": "0917 555 0101",
    "email": "juan.delacruz@example.com",
    "password": "laundry123",
    "password_confirmation": "laundry123",
    "barangay_id": 28,
    "street_address": "Purok 3"
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-customer-auth-register">
</span>
<span id="execution-results-POSTapi-v1-customer-auth-register" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-customer-auth-register"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-customer-auth-register"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-customer-auth-register" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-customer-auth-register">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-customer-auth-register" data-method="POST"
      data-path="api/v1/customer/auth/register"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-customer-auth-register', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-customer-auth-register"
                    onclick="tryItOut('POSTapi-v1-customer-auth-register');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-customer-auth-register"
                    onclick="cancelTryOut('POSTapi-v1-customer-auth-register');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-customer-auth-register"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/customer/auth/register</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-customer-auth-register"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-customer-auth-register"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>full_name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="full_name"                data-endpoint="POSTapi-v1-customer-auth-register"
               value="Juan Dela Cruz"
               data-component="body">
    <br>
<p>Must be at least 2 characters. Must not be greater than 255 characters. Example: <code>Juan Dela Cruz</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>contact_number</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="contact_number"                data-endpoint="POSTapi-v1-customer-auth-register"
               value="0917 555 0101"
               data-component="body">
    <br>
<p>A PH mobile number. Must match the regex /^09\d{9}$/. Example: <code>0917 555 0101</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>email</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="email"                data-endpoint="POSTapi-v1-customer-auth-register"
               value="juan.delacruz@example.com"
               data-component="body">
    <br>
<p>Must be a valid email address. Must not be greater than 255 characters. Example: <code>juan.delacruz@example.com</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>password</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="password"                data-endpoint="POSTapi-v1-customer-auth-register"
               value="laundry123"
               data-component="body">
    <br>
<p>At least 8 characters, with a letter and a number. Example: <code>laundry123</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>password_confirmation</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="password_confirmation"                data-endpoint="POSTapi-v1-customer-auth-register"
               value="laundry123"
               data-component="body">
    <br>
<p>The value and <code>password</code> must match. Example: <code>laundry123</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>barangay_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="barangay_id"                data-endpoint="POSTapi-v1-customer-auth-register"
               value="28"
               data-component="body">
    <br>
<p>Must match an existing stored value. Example: <code>28</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>street_address</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="street_address"                data-endpoint="POSTapi-v1-customer-auth-register"
               value="Purok 3"
               data-component="body">
    <br>
<p>Must not be greater than 255 characters. Example: <code>Purok 3</code></p>
        </div>
        </form>

                    <h2 id="customer-portal-authentication-POSTapi-v1-customer-auth-login">Log in</h2>

<p>
</p>

<p>Five failed attempts a minute for the same email and IP answer 429.</p>

<span id="example-requests-POSTapi-v1-customer-auth-login">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/customer/auth/login" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"email\": \"maria.santos@example.com\",
    \"password\": \"password123\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customer/auth/login"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "email": "maria.santos@example.com",
    "password": "password123"
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-customer-auth-login">
</span>
<span id="execution-results-POSTapi-v1-customer-auth-login" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-customer-auth-login"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-customer-auth-login"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-customer-auth-login" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-customer-auth-login">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-customer-auth-login" data-method="POST"
      data-path="api/v1/customer/auth/login"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-customer-auth-login', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-customer-auth-login"
                    onclick="tryItOut('POSTapi-v1-customer-auth-login');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-customer-auth-login"
                    onclick="cancelTryOut('POSTapi-v1-customer-auth-login');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-customer-auth-login"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/customer/auth/login</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-customer-auth-login"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-customer-auth-login"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>email</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="email"                data-endpoint="POSTapi-v1-customer-auth-login"
               value="maria.santos@example.com"
               data-component="body">
    <br>
<p>Must not be greater than 255 characters. Example: <code>maria.santos@example.com</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>password</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="password"                data-endpoint="POSTapi-v1-customer-auth-login"
               value="password123"
               data-component="body">
    <br>
<p>Example: <code>password123</code></p>
        </div>
        </form>

                    <h2 id="customer-portal-authentication-POSTapi-v1-customer-auth-refresh">Refresh the token</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>An expired token is accepted within JWT_REFRESH_TTL.</p>

<span id="example-requests-POSTapi-v1-customer-auth-refresh">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/customer/auth/refresh" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customer/auth/refresh"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "POST",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-customer-auth-refresh">
</span>
<span id="execution-results-POSTapi-v1-customer-auth-refresh" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-customer-auth-refresh"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-customer-auth-refresh"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-customer-auth-refresh" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-customer-auth-refresh">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-customer-auth-refresh" data-method="POST"
      data-path="api/v1/customer/auth/refresh"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-customer-auth-refresh', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-customer-auth-refresh"
                    onclick="tryItOut('POSTapi-v1-customer-auth-refresh');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-customer-auth-refresh"
                    onclick="cancelTryOut('POSTapi-v1-customer-auth-refresh');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-customer-auth-refresh"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/customer/auth/refresh</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-customer-auth-refresh"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-customer-auth-refresh"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-customer-auth-refresh"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="customer-portal-authentication-GETapi-v1-customer-auth-me">Current customer</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-v1-customer-auth-me">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/customer/auth/me" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customer/auth/me"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-customer-auth-me">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;customer&quot;: {
            &quot;type&quot;: &quot;customerAccount&quot;,
            &quot;id&quot;: 1,
            &quot;attributes&quot;: {
                &quot;fullName&quot;: &quot;Maria Santos&quot;,
                &quot;email&quot;: &quot;maria.santos@example.com&quot;,
                &quot;contactNumber&quot;: &quot;09178452210&quot;,
                &quot;barangayId&quot;: 28,
                &quot;barangayName&quot;: &quot;Poblacion&quot;,
                &quot;streetAddress&quot;: null,
                &quot;mustChangePassword&quot;: false
            },
            &quot;links&quot;: {
                &quot;self&quot;: &quot;http://laundryflow.test/api/v1/customer/auth/me&quot;
            }
        }
    },
    &quot;message&quot;: &quot;Customer retrieved&quot;,
    &quot;status&quot;: 200
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-customer-auth-me" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-customer-auth-me"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-customer-auth-me"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-customer-auth-me" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-customer-auth-me">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-customer-auth-me" data-method="GET"
      data-path="api/v1/customer/auth/me"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-customer-auth-me', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-customer-auth-me"
                    onclick="tryItOut('GETapi-v1-customer-auth-me');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-customer-auth-me"
                    onclick="cancelTryOut('GETapi-v1-customer-auth-me');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-customer-auth-me"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/customer/auth/me</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-customer-auth-me"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-customer-auth-me"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-customer-auth-me"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="customer-portal-authentication-POSTapi-v1-customer-auth-logout">Log out</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-POSTapi-v1-customer-auth-logout">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/customer/auth/logout" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customer/auth/logout"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "POST",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-customer-auth-logout">
</span>
<span id="execution-results-POSTapi-v1-customer-auth-logout" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-customer-auth-logout"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-customer-auth-logout"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-customer-auth-logout" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-customer-auth-logout">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-customer-auth-logout" data-method="POST"
      data-path="api/v1/customer/auth/logout"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-customer-auth-logout', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-customer-auth-logout"
                    onclick="tryItOut('POSTapi-v1-customer-auth-logout');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-customer-auth-logout"
                    onclick="cancelTryOut('POSTapi-v1-customer-auth-logout');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-customer-auth-logout"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/customer/auth/logout</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-customer-auth-logout"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-customer-auth-logout"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-customer-auth-logout"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="customer-portal-authentication-PUTapi-v1-customer-account-password">Change my password</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Allowed while a password change is pending; clears must_change_password.</p>

<span id="example-requests-PUTapi-v1-customer-account-password">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/v1/customer/account/password" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"current_password\": \"k7m2p9qx4t\",
    \"password\": \"laundry2026\",
    \"password_confirmation\": \"laundry2026\"
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customer/account/password"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "current_password": "k7m2p9qx4t",
    "password": "laundry2026",
    "password_confirmation": "laundry2026"
};

fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-v1-customer-account-password">
</span>
<span id="execution-results-PUTapi-v1-customer-account-password" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-v1-customer-account-password"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-v1-customer-account-password"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-v1-customer-account-password" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-v1-customer-account-password">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-v1-customer-account-password" data-method="PUT"
      data-path="api/v1/customer/account/password"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-v1-customer-account-password', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-v1-customer-account-password"
                    onclick="tryItOut('PUTapi-v1-customer-account-password');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-v1-customer-account-password"
                    onclick="cancelTryOut('PUTapi-v1-customer-account-password');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-v1-customer-account-password"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/v1/customer/account/password</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PUTapi-v1-customer-account-password"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-v1-customer-account-password"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-v1-customer-account-password"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>current_password</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="current_password"                data-endpoint="PUTapi-v1-customer-account-password"
               value="k7m2p9qx4t"
               data-component="body">
    <br>
<p>The current password, or the temporary one the owner or shop gave. Example: <code>k7m2p9qx4t</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>password</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="password"                data-endpoint="PUTapi-v1-customer-account-password"
               value="laundry2026"
               data-component="body">
    <br>
<p>At least 8 characters, with a letter and a number, different from the current one. Example: <code>laundry2026</code></p>
        </div>
                <div style=" padding-left: 28px;  clear: unset;">
            <b style="line-height: 2;"><code>password_confirmation</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="password_confirmation"                data-endpoint="PUTapi-v1-customer-account-password"
               value="laundry2026"
               data-component="body">
    <br>
<p>The new password again. The value and <code>password</code> must match. Example: <code>laundry2026</code></p>
        </div>
        </form>

                <h1 id="customers">Customers</h1>

    <p>Customer profiles and counter registration.</p>

                                <h2 id="customers-GETapi-v1-customer-barangays">List barangays</h2>

<p>
</p>

<p>The 36 barangays of Bongabong. Also public at /customer/barangays, for registration (names only).</p>

<span id="example-requests-GETapi-v1-customer-barangays">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/customer/barangays" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customer/barangays"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-customer-barangays">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: [
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 1,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Anilao&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 2,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Aplaya&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 3,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Bagong Bayan I&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 4,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Bagong Bayan II&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 5,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Batangan&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 6,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Bukal&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 7,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Camantigue&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 8,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Carmundo&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 9,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Cawayan&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 10,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Dayhagan&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 11,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Formon&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 12,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Hagan&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 13,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Hagupit&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 14,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Ipil&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 15,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Kaligtasan&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 16,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Labasan&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 17,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Labonan&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 18,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Libertad&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 19,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Lisap&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 20,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Luna&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 21,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Malitbog&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 22,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Mapang&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 23,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Masaguisi&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 24,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Mina de Oro&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 25,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Morente&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 26,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Ogbot&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 27,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Orconuma&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 28,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Poblacion&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 29,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Pulosahi&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 30,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Sagana&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 31,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;San Isidro&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 32,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;San Jose&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 33,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;San Juan&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 34,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Sigange&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 35,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Sta. Cruz&quot;
            }
        },
        {
            &quot;type&quot;: &quot;barangay&quot;,
            &quot;id&quot;: 36,
            &quot;attributes&quot;: {
                &quot;name&quot;: &quot;Tawas&quot;
            }
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-customer-barangays" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-customer-barangays"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-customer-barangays"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-customer-barangays" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-customer-barangays">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-customer-barangays" data-method="GET"
      data-path="api/v1/customer/barangays"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-customer-barangays', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-customer-barangays"
                    onclick="tryItOut('GETapi-v1-customer-barangays');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-customer-barangays"
                    onclick="cancelTryOut('GETapi-v1-customer-barangays');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-customer-barangays"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/customer/barangays</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-customer-barangays"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-customer-barangays"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="customers-GETapi-v1-barangays">List barangays</h2>

<p>
</p>

<p>The 36 barangays of Bongabong. Also public at /customer/barangays, for registration (names only).</p>

<span id="example-requests-GETapi-v1-barangays">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/barangays" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/barangays"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-barangays">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-barangays" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-barangays"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-barangays"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-barangays" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-barangays">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-barangays" data-method="GET"
      data-path="api/v1/barangays"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-barangays', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-barangays"
                    onclick="tryItOut('GETapi-v1-barangays');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-barangays"
                    onclick="cancelTryOut('GETapi-v1-barangays');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-barangays"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/barangays</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-barangays"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-barangays"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="customers-GETapi-v1-customers">List customers</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Most recent visit first, 15 per page. <code>meta.withBalance</code> counts customers who still owe.</p>

<span id="example-requests-GETapi-v1-customers">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/customers?search=santos&amp;fullName=%2Asantos%2A&amp;barangay=28&amp;hasAccount=1&amp;sort=-lastVisitAt&amp;page=1&amp;perPage=15" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customers"
);

const params = {
    "search": "santos",
    "fullName": "*santos*",
    "barangay": "28",
    "hasAccount": "1",
    "sort": "-lastVisitAt",
    "page": "1",
    "perPage": "15",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-customers">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-customers" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-customers"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-customers"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-customers" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-customers">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-customers" data-method="GET"
      data-path="api/v1/customers"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-customers', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-customers"
                    onclick="tryItOut('GETapi-v1-customers');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-customers"
                    onclick="cancelTryOut('GETapi-v1-customers');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-customers"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/customers</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-customers"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-customers"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-customers"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>search</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="search"                data-endpoint="GETapi-v1-customers"
               value="santos"
               data-component="query">
    <br>
<p>Name, email or phone digits. Example: <code>santos</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>fullName</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="fullName"                data-endpoint="GETapi-v1-customers"
               value="*santos*"
               data-component="query">
    <br>
<p>Name, <em> as a wildcard. Example: `</em>santos*`</p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>barangay</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="barangay"                data-endpoint="GETapi-v1-customers"
               value="28"
               data-component="query">
    <br>
<p>Barangay ids, comma separated. Example: <code>28</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>hasAccount</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="GETapi-v1-customers" style="display: none">
            <input type="radio" name="hasAccount"
                   value="1"
                   data-endpoint="GETapi-v1-customers"
                   data-component="query"             >
            <code>true</code>
        </label>
        <label data-endpoint="GETapi-v1-customers" style="display: none">
            <input type="radio" name="hasAccount"
                   value="0"
                   data-endpoint="GETapi-v1-customers"
                   data-component="query"             >
            <code>false</code>
        </label>
    <br>
<p>Only with (true) or without (false) an account. Example: <code>true</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>sort</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="sort"                data-endpoint="GETapi-v1-customers"
               value="-lastVisitAt"
               data-component="query">
    <br>
<p>fullName, createdAt or lastVisitAt; prefix - for descending. Example: <code>-lastVisitAt</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>page</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="page"                data-endpoint="GETapi-v1-customers"
               value="1"
               data-component="query">
    <br>
<p>The page number. Example: <code>1</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>perPage</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="perPage"                data-endpoint="GETapi-v1-customers"
               value="15"
               data-component="query">
    <br>
<p>Rows per page (1–500). Example: <code>15</code></p>
            </div>
                </form>

                    <h2 id="customers-POSTapi-v1-customers">Register a customer at the counter</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Creates the profile and its account in one step. The temporary password is in the response
once: read it out to the customer. They must change it at the first sign-in.</p>

<span id="example-requests-POSTapi-v1-customers">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/customers" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"fullName\": \"Juan Dela Cruz\",
            \"contactNumber\": \"0917 555 0101\",
            \"streetAddress\": \"Purok 3\",
            \"notes\": \"Prefers unscented conditioner\",
            \"email\": \"juan.delacruz@example.com\"
        },
        \"relationships\": {
            \"barangay\": {
                \"data\": {
                    \"id\": 28
                }
            }
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customers"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "fullName": "Juan Dela Cruz",
            "contactNumber": "0917 555 0101",
            "streetAddress": "Purok 3",
            "notes": "Prefers unscented conditioner",
            "email": "juan.delacruz@example.com"
        },
        "relationships": {
            "barangay": {
                "data": {
                    "id": 28
                }
            }
        }
    }
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-customers">
</span>
<span id="execution-results-POSTapi-v1-customers" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-customers"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-customers"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-customers" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-customers">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-customers" data-method="POST"
      data-path="api/v1/customers"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-customers', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-customers"
                    onclick="tryItOut('POSTapi-v1-customers');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-customers"
                    onclick="cancelTryOut('POSTapi-v1-customers');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-customers"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/customers</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-customers"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-customers"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-customers"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>fullName</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.fullName"                data-endpoint="POSTapi-v1-customers"
               value="Juan Dela Cruz"
               data-component="body">
    <br>
<p>Full name. Must be at least 2 characters. Must not be greater than 255 characters. Example: <code>Juan Dela Cruz</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>contactNumber</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.contactNumber"                data-endpoint="POSTapi-v1-customers"
               value="0917 555 0101"
               data-component="body">
    <br>
<p>PH mobile number, stored as 09XXXXXXXXX. Must match the regex /^09\d{9}$/. Example: <code>0917 555 0101</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>streetAddress</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.streetAddress"                data-endpoint="POSTapi-v1-customers"
               value="Purok 3"
               data-component="body">
    <br>
<p>Street or purok. Must not be greater than 255 characters. Example: <code>Purok 3</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>notes</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.notes"                data-endpoint="POSTapi-v1-customers"
               value="Prefers unscented conditioner"
               data-component="body">
    <br>
<p>Notes for the counter. Must not be greater than 2000 characters. Example: <code>Prefers unscented conditioner</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>email</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.email"                data-endpoint="POSTapi-v1-customers"
               value="juan.delacruz@example.com"
               data-component="body">
    <br>
<p>The sign-in email of the new account. Must not be greater than 255 characters. Example: <code>juan.delacruz@example.com</code></p>
                    </div>
                                    </details>
        </div>
                                                                    <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>relationships</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 28px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>barangay</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 42px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 56px; clear: unset;">
                        <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.relationships.barangay.data.id"                data-endpoint="POSTapi-v1-customers"
               value="28"
               data-component="body">
    <br>
<p>The barangay id. Must match an existing stored value. Example: <code>28</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="customers-GETapi-v1-customers--id-">Show a customer</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-v1-customers--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/customers/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customers/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-customers--id-">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-customers--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-customers--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-customers--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-customers--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-customers--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-customers--id-" data-method="GET"
      data-path="api/v1/customers/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-customers--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-customers--id-"
                    onclick="tryItOut('GETapi-v1-customers--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-customers--id-"
                    onclick="cancelTryOut('GETapi-v1-customers--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-customers--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/customers/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-customers--id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-customers--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-customers--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="GETapi-v1-customers--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the customer. Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="customers-PUTapi-v1-customers--customer_id-">Replace a customer&#039;s profile (every field)</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PUTapi-v1-customers--customer_id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/v1/customers/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"fullName\": \"Juan Dela Cruz\",
            \"contactNumber\": \"0917 555 0101\",
            \"streetAddress\": \"Purok 3\",
            \"notes\": \"Prefers unscented conditioner\"
        },
        \"relationships\": {
            \"barangay\": {
                \"data\": {
                    \"id\": 28
                }
            }
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customers/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "fullName": "Juan Dela Cruz",
            "contactNumber": "0917 555 0101",
            "streetAddress": "Purok 3",
            "notes": "Prefers unscented conditioner"
        },
        "relationships": {
            "barangay": {
                "data": {
                    "id": 28
                }
            }
        }
    }
};

fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-v1-customers--customer_id-">
</span>
<span id="execution-results-PUTapi-v1-customers--customer_id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-v1-customers--customer_id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-v1-customers--customer_id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-v1-customers--customer_id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-v1-customers--customer_id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-v1-customers--customer_id-" data-method="PUT"
      data-path="api/v1/customers/{customer_id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-v1-customers--customer_id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-v1-customers--customer_id-"
                    onclick="tryItOut('PUTapi-v1-customers--customer_id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-v1-customers--customer_id-"
                    onclick="cancelTryOut('PUTapi-v1-customers--customer_id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-v1-customers--customer_id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/v1/customers/{customer_id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PUTapi-v1-customers--customer_id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-v1-customers--customer_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-v1-customers--customer_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>customer_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="customer_id"                data-endpoint="PUTapi-v1-customers--customer_id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the customer. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>fullName</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.fullName"                data-endpoint="PUTapi-v1-customers--customer_id-"
               value="Juan Dela Cruz"
               data-component="body">
    <br>
<p>Full name. Must be at least 2 characters. Must not be greater than 255 characters. Example: <code>Juan Dela Cruz</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>contactNumber</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.contactNumber"                data-endpoint="PUTapi-v1-customers--customer_id-"
               value="0917 555 0101"
               data-component="body">
    <br>
<p>PH mobile number, stored as 09XXXXXXXXX. Must match the regex /^09\d{9}$/. Example: <code>0917 555 0101</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>streetAddress</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.streetAddress"                data-endpoint="PUTapi-v1-customers--customer_id-"
               value="Purok 3"
               data-component="body">
    <br>
<p>Street or purok. Must not be greater than 255 characters. Example: <code>Purok 3</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>notes</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.notes"                data-endpoint="PUTapi-v1-customers--customer_id-"
               value="Prefers unscented conditioner"
               data-component="body">
    <br>
<p>Notes for the counter. Must not be greater than 2000 characters. Example: <code>Prefers unscented conditioner</code></p>
                    </div>
                                    </details>
        </div>
                                                                    <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>relationships</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 28px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>barangay</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 42px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 56px; clear: unset;">
                        <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.relationships.barangay.data.id"                data-endpoint="PUTapi-v1-customers--customer_id-"
               value="28"
               data-component="body">
    <br>
<p>The barangay id. Must match an existing stored value. Example: <code>28</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="customers-PATCHapi-v1-customers--id-">Update a customer&#039;s profile (fields sent)</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PATCHapi-v1-customers--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PATCH \
    "http://localhost:8000/api/v1/customers/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"fullName\": \"Juan Dela Cruz\",
            \"contactNumber\": \"0917 555 0101\",
            \"streetAddress\": \"Purok 3\",
            \"notes\": \"Prefers unscented conditioner\"
        },
        \"relationships\": {
            \"barangay\": {
                \"data\": {
                    \"id\": 28
                }
            }
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customers/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "fullName": "Juan Dela Cruz",
            "contactNumber": "0917 555 0101",
            "streetAddress": "Purok 3",
            "notes": "Prefers unscented conditioner"
        },
        "relationships": {
            "barangay": {
                "data": {
                    "id": 28
                }
            }
        }
    }
};

fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PATCHapi-v1-customers--id-">
</span>
<span id="execution-results-PATCHapi-v1-customers--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PATCHapi-v1-customers--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PATCHapi-v1-customers--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PATCHapi-v1-customers--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PATCHapi-v1-customers--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PATCHapi-v1-customers--id-" data-method="PATCH"
      data-path="api/v1/customers/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PATCHapi-v1-customers--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PATCHapi-v1-customers--id-"
                    onclick="tryItOut('PATCHapi-v1-customers--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PATCHapi-v1-customers--id-"
                    onclick="cancelTryOut('PATCHapi-v1-customers--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PATCHapi-v1-customers--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/v1/customers/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PATCHapi-v1-customers--id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PATCHapi-v1-customers--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PATCHapi-v1-customers--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="PATCHapi-v1-customers--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the customer. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>fullName</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.fullName"                data-endpoint="PATCHapi-v1-customers--id-"
               value="Juan Dela Cruz"
               data-component="body">
    <br>
<p>Full name. Must be at least 2 characters. Must not be greater than 255 characters. Example: <code>Juan Dela Cruz</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>contactNumber</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.contactNumber"                data-endpoint="PATCHapi-v1-customers--id-"
               value="0917 555 0101"
               data-component="body">
    <br>
<p>PH mobile number, stored as 09XXXXXXXXX. Must match the regex /^09\d{9}$/. Example: <code>0917 555 0101</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>streetAddress</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.streetAddress"                data-endpoint="PATCHapi-v1-customers--id-"
               value="Purok 3"
               data-component="body">
    <br>
<p>Street or purok. Must not be greater than 255 characters. Example: <code>Purok 3</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>notes</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.notes"                data-endpoint="PATCHapi-v1-customers--id-"
               value="Prefers unscented conditioner"
               data-component="body">
    <br>
<p>Notes for the counter. Must not be greater than 2000 characters. Example: <code>Prefers unscented conditioner</code></p>
                    </div>
                                    </details>
        </div>
                                                                    <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>relationships</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 28px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>barangay</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 42px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 56px; clear: unset;">
                        <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.relationships.barangay.data.id"                data-endpoint="PATCHapi-v1-customers--id-"
               value="28"
               data-component="body">
    <br>
<p>The barangay id. Must match an existing stored value. Example: <code>28</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="customers-GETapi-v1-customers--customer_id--orders">List a customer&#039;s orders</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>The orders of one customer (a nested resource, course L13), newest first. Every order filter
works here too.</p>

<span id="example-requests-GETapi-v1-customers--customer_id--orders">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/customers/1/orders?include=customer%2Cbaskets%2Citems%2CreceivedBy" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customers/1/orders"
);

const params = {
    "include": "customer,baskets,items,receivedBy",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-customers--customer_id--orders">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-customers--customer_id--orders" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-customers--customer_id--orders"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-customers--customer_id--orders"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-customers--customer_id--orders" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-customers--customer_id--orders">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-customers--customer_id--orders" data-method="GET"
      data-path="api/v1/customers/{customer_id}/orders"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-customers--customer_id--orders', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-customers--customer_id--orders"
                    onclick="tryItOut('GETapi-v1-customers--customer_id--orders');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-customers--customer_id--orders"
                    onclick="cancelTryOut('GETapi-v1-customers--customer_id--orders');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-customers--customer_id--orders"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/customers/{customer_id}/orders</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-customers--customer_id--orders"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-customers--customer_id--orders"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-customers--customer_id--orders"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>customer_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="customer_id"                data-endpoint="GETapi-v1-customers--customer_id--orders"
               value="1"
               data-component="url">
    <br>
<p>The ID of the customer. Example: <code>1</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>include</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="include"                data-endpoint="GETapi-v1-customers--customer_id--orders"
               value="customer,baskets,items,receivedBy"
               data-component="query">
    <br>
<p>As on GET /orders. Example: <code>customer,baskets,items,receivedBy</code></p>
            </div>
                </form>

                    <h2 id="customers-POSTapi-v1-customers--customer_id--account">Create an account for a legacy profile</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Answers 409 when the customer already has one. The temporary password is shown once.</p>

<span id="example-requests-POSTapi-v1-customers--customer_id--account">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/customers/1/account" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"email\": \"janine.alcantara@example.com\"
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customers/1/account"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "email": "janine.alcantara@example.com"
        }
    }
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-customers--customer_id--account">
</span>
<span id="execution-results-POSTapi-v1-customers--customer_id--account" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-customers--customer_id--account"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-customers--customer_id--account"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-customers--customer_id--account" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-customers--customer_id--account">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-customers--customer_id--account" data-method="POST"
      data-path="api/v1/customers/{customer_id}/account"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-customers--customer_id--account', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-customers--customer_id--account"
                    onclick="tryItOut('POSTapi-v1-customers--customer_id--account');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-customers--customer_id--account"
                    onclick="cancelTryOut('POSTapi-v1-customers--customer_id--account');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-customers--customer_id--account"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/customers/{customer_id}/account</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-customers--customer_id--account"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-customers--customer_id--account"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-customers--customer_id--account"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>customer_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="customer_id"                data-endpoint="POSTapi-v1-customers--customer_id--account"
               value="1"
               data-component="url">
    <br>
<p>The ID of the customer. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>email</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.email"                data-endpoint="POSTapi-v1-customers--customer_id--account"
               value="janine.alcantara@example.com"
               data-component="body">
    <br>
<p>Must not be greater than 255 characters. Example: <code>janine.alcantara@example.com</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="customers-PATCHapi-v1-customers--customer_id--account">Enable or disable sign-in</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Owner only.</p>

<span id="example-requests-PATCHapi-v1-customers--customer_id--account">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PATCH \
    "http://localhost:8000/api/v1/customers/1/account" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"isActive\": false
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customers/1/account"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "isActive": false
        }
    }
};

fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PATCHapi-v1-customers--customer_id--account">
</span>
<span id="execution-results-PATCHapi-v1-customers--customer_id--account" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PATCHapi-v1-customers--customer_id--account"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PATCHapi-v1-customers--customer_id--account"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PATCHapi-v1-customers--customer_id--account" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PATCHapi-v1-customers--customer_id--account">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PATCHapi-v1-customers--customer_id--account" data-method="PATCH"
      data-path="api/v1/customers/{customer_id}/account"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PATCHapi-v1-customers--customer_id--account', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PATCHapi-v1-customers--customer_id--account"
                    onclick="tryItOut('PATCHapi-v1-customers--customer_id--account');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PATCHapi-v1-customers--customer_id--account"
                    onclick="cancelTryOut('PATCHapi-v1-customers--customer_id--account');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PATCHapi-v1-customers--customer_id--account"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/v1/customers/{customer_id}/account</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PATCHapi-v1-customers--customer_id--account"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PATCHapi-v1-customers--customer_id--account"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PATCHapi-v1-customers--customer_id--account"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>customer_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="customer_id"                data-endpoint="PATCHapi-v1-customers--customer_id--account"
               value="1"
               data-component="url">
    <br>
<p>The ID of the customer. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>isActive</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
 &nbsp;
 &nbsp;
                <label data-endpoint="PATCHapi-v1-customers--customer_id--account" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="true"
                   data-endpoint="PATCHapi-v1-customers--customer_id--account"
                   data-component="body"             >
            <code>true</code>
        </label>
        <label data-endpoint="PATCHapi-v1-customers--customer_id--account" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="false"
                   data-endpoint="PATCHapi-v1-customers--customer_id--account"
                   data-component="body"             >
            <code>false</code>
        </label>
    <br>
<p>Example: <code>false</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="customers-POSTapi-v1-customers--customer_id--reset-password">Reset the customer&#039;s password</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Issues a new temporary password (shown once) and asks the customer to change it.</p>

<span id="example-requests-POSTapi-v1-customers--customer_id--reset-password">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/customers/1/reset-password" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/customers/1/reset-password"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "POST",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-customers--customer_id--reset-password">
</span>
<span id="execution-results-POSTapi-v1-customers--customer_id--reset-password" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-customers--customer_id--reset-password"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-customers--customer_id--reset-password"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-customers--customer_id--reset-password" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-customers--customer_id--reset-password">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-customers--customer_id--reset-password" data-method="POST"
      data-path="api/v1/customers/{customer_id}/reset-password"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-customers--customer_id--reset-password', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-customers--customer_id--reset-password"
                    onclick="tryItOut('POSTapi-v1-customers--customer_id--reset-password');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-customers--customer_id--reset-password"
                    onclick="cancelTryOut('POSTapi-v1-customers--customer_id--reset-password');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-customers--customer_id--reset-password"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/customers/{customer_id}/reset-password</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-customers--customer_id--reset-password"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-customers--customer_id--reset-password"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-customers--customer_id--reset-password"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>customer_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="customer_id"                data-endpoint="POSTapi-v1-customers--customer_id--reset-password"
               value="1"
               data-component="url">
    <br>
<p>The ID of the customer. Example: <code>1</code></p>
            </div>
                    </form>

                <h1 id="dashboard">Dashboard</h1>

    

                                <h2 id="dashboard-GETapi-v1-dashboard-summary">Today at a glance</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Today's work for the counter: KPIs, the flow per stage, recent orders, low stock and what
needs action. Sales figures are added only for users who may see them (sales.view): staff
responses contain no money from payments.</p>

<span id="example-requests-GETapi-v1-dashboard-summary">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/dashboard/summary" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/dashboard/summary"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-dashboard-summary">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-dashboard-summary" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-dashboard-summary"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-dashboard-summary"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-dashboard-summary" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-dashboard-summary">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-dashboard-summary" data-method="GET"
      data-path="api/v1/dashboard/summary"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-dashboard-summary', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-dashboard-summary"
                    onclick="tryItOut('GETapi-v1-dashboard-summary');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-dashboard-summary"
                    onclick="cancelTryOut('GETapi-v1-dashboard-summary');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-dashboard-summary"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/dashboard/summary</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-dashboard-summary"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-dashboard-summary"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-dashboard-summary"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="dashboard-GETapi-v1-analytics-dashboard">Dashboard analytics</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>The dashboard's KPIs and charts for a Manila date range, compared with the range of the same
length just before it. Users with sales.view get the admin document; everyone else gets the
staff document, which is built without a single peso field (not hidden: never sent).</p>
<p>The document is not a model resource: it is the analytics envelope
{ range, compare_range, generated_at, kpis, series, table, insights }, inside ok().</p>

<span id="example-requests-GETapi-v1-analytics-dashboard">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/analytics/dashboard?from=2026-10-10&amp;to=2026-11-08&amp;compare=previous" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/analytics/dashboard"
);

const params = {
    "from": "2026-10-10",
    "to": "2026-11-08",
    "compare": "previous",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-analytics-dashboard">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-analytics-dashboard" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-analytics-dashboard"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-analytics-dashboard"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-analytics-dashboard" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-analytics-dashboard">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-analytics-dashboard" data-method="GET"
      data-path="api/v1/analytics/dashboard"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-analytics-dashboard', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-analytics-dashboard"
                    onclick="tryItOut('GETapi-v1-analytics-dashboard');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-analytics-dashboard"
                    onclick="cancelTryOut('GETapi-v1-analytics-dashboard');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-analytics-dashboard"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/analytics/dashboard</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-analytics-dashboard"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-analytics-dashboard"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-analytics-dashboard"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>from</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="from"                data-endpoint="GETapi-v1-analytics-dashboard"
               value="2026-10-10"
               data-component="query">
    <br>
<p>First Manila day (Y-m-d). Defaults to 29 days ago. Example: <code>2026-10-10</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>to</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="to"                data-endpoint="GETapi-v1-analytics-dashboard"
               value="2026-11-08"
               data-component="query">
    <br>
<p>Last Manila day, inclusive. Defaults to today. Example: <code>2026-11-08</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>compare</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="compare"                data-endpoint="GETapi-v1-analytics-dashboard"
               value="previous"
               data-component="query">
    <br>
<p>previous (default) or none. Example: <code>previous</code></p>
            </div>
                </form>

                <h1 id="health">Health</h1>

    

                                <h2 id="health-GETapi-v1-health">Check the API</h2>

<p>
</p>

<p>Answers 200 when the API runs and its database accepts queries, and 503 when the database
cannot be reached. It never returns data from the database. Docker's health check and the
frontend's dev server call it.</p>

<span id="example-requests-GETapi-v1-health">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/health" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/health"
);

const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-health">
            <blockquote>
            <p>Example response (200):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;data&quot;: {
        &quot;status&quot;: &quot;ok&quot;,
        &quot;database&quot;: &quot;ok&quot;
    },
    &quot;message&quot;: &quot;OK&quot;,
    &quot;status&quot;: 200
}</code>
 </pre>
            <blockquote>
            <p>Example response (503):</p>
        </blockquote>
                <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 503,
            &quot;message&quot;: &quot;The database is not reachable.&quot;,
            &quot;source&quot;: &quot;database&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-health" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-health"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-health"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-health" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-health">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-health" data-method="GET"
      data-path="api/v1/health"
      data-authed="0"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-health', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-health"
                    onclick="tryItOut('GETapi-v1-health');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-health"
                    onclick="cancelTryOut('GETapi-v1-health');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-health"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/health</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-health"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-health"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                <h1 id="inventory">Inventory</h1>

    <p>Supply items. Stock on hand is computed from the movements, never typed in.</p>

                                <h2 id="inventory-GETapi-v1-inventory-units">List units</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-v1-inventory-units">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/inventory/units" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/inventory/units"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-inventory-units">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-inventory-units" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-inventory-units"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-inventory-units"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-inventory-units" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-inventory-units">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-inventory-units" data-method="GET"
      data-path="api/v1/inventory/units"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-inventory-units', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-inventory-units"
                    onclick="tryItOut('GETapi-v1-inventory-units');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-inventory-units"
                    onclick="cancelTryOut('GETapi-v1-inventory-units');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-inventory-units"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/inventory/units</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-inventory-units"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-inventory-units"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-inventory-units"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="inventory-GETapi-v1-inventory-items">List supply items</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Active items, Critical first, then Low, then OK.</p>

<span id="example-requests-GETapi-v1-inventory-items">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/inventory/items" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/inventory/items"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-inventory-items">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-inventory-items" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-inventory-items"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-inventory-items"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-inventory-items" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-inventory-items">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-inventory-items" data-method="GET"
      data-path="api/v1/inventory/items"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-inventory-items', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-inventory-items"
                    onclick="tryItOut('GETapi-v1-inventory-items');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-inventory-items"
                    onclick="cancelTryOut('GETapi-v1-inventory-items');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-inventory-items"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/inventory/items</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-inventory-items"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-inventory-items"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-inventory-items"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="inventory-POSTapi-v1-inventory-items">Add a supply item</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-POSTapi-v1-inventory-items">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/inventory/items" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"name\": \"Detergent powder\",
            \"reorderLevel\": 5,
            \"isActive\": true
        },
        \"relationships\": {
            \"unit\": {
                \"data\": {
                    \"id\": 1
                }
            }
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/inventory/items"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "name": "Detergent powder",
            "reorderLevel": 5,
            "isActive": true
        },
        "relationships": {
            "unit": {
                "data": {
                    "id": 1
                }
            }
        }
    }
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-inventory-items">
</span>
<span id="execution-results-POSTapi-v1-inventory-items" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-inventory-items"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-inventory-items"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-inventory-items" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-inventory-items">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-inventory-items" data-method="POST"
      data-path="api/v1/inventory/items"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-inventory-items', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-inventory-items"
                    onclick="tryItOut('POSTapi-v1-inventory-items');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-inventory-items"
                    onclick="cancelTryOut('POSTapi-v1-inventory-items');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-inventory-items"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/inventory/items</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-inventory-items"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-inventory-items"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-inventory-items"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.name"                data-endpoint="POSTapi-v1-inventory-items"
               value="Detergent powder"
               data-component="body">
    <br>
<p>Must be at least 2 characters. Must not be greater than 100 characters. Example: <code>Detergent powder</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>reorderLevel</code></b>&nbsp;&nbsp;
<small>number</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.reorderLevel"                data-endpoint="POSTapi-v1-inventory-items"
               value="5"
               data-component="body">
    <br>
<p>Low at or below this; Critical at or below half. Must be at least 0. Example: <code>5</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>isActive</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="POSTapi-v1-inventory-items" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="true"
                   data-endpoint="POSTapi-v1-inventory-items"
                   data-component="body"             >
            <code>true</code>
        </label>
        <label data-endpoint="POSTapi-v1-inventory-items" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="false"
                   data-endpoint="POSTapi-v1-inventory-items"
                   data-component="body"             >
            <code>false</code>
        </label>
    <br>
<p>Example: <code>true</code></p>
                    </div>
                                    </details>
        </div>
                                                                    <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>relationships</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 28px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>unit</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 42px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 56px; clear: unset;">
                        <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.relationships.unit.data.id"                data-endpoint="POSTapi-v1-inventory-items"
               value="1"
               data-component="body">
    <br>
<p>kg 1, L 2, pcs 3, rolls 4. Must match an existing stored value. Example: <code>1</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="inventory-GETapi-v1-inventory-items--id-">Show a supply item</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-v1-inventory-items--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/inventory/items/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/inventory/items/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-inventory-items--id-">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-inventory-items--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-inventory-items--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-inventory-items--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-inventory-items--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-inventory-items--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-inventory-items--id-" data-method="GET"
      data-path="api/v1/inventory/items/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-inventory-items--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-inventory-items--id-"
                    onclick="tryItOut('GETapi-v1-inventory-items--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-inventory-items--id-"
                    onclick="cancelTryOut('GETapi-v1-inventory-items--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-inventory-items--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/inventory/items/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-inventory-items--id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-inventory-items--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-inventory-items--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="GETapi-v1-inventory-items--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the item. Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="inventory-PUTapi-v1-inventory-items--item_id-">Replace a supply item (every field)</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PUTapi-v1-inventory-items--item_id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/v1/inventory/items/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"name\": \"Detergent powder\",
            \"reorderLevel\": 5,
            \"isActive\": true
        },
        \"relationships\": {
            \"unit\": {
                \"data\": {
                    \"id\": 1
                }
            }
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/inventory/items/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "name": "Detergent powder",
            "reorderLevel": 5,
            "isActive": true
        },
        "relationships": {
            "unit": {
                "data": {
                    "id": 1
                }
            }
        }
    }
};

fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-v1-inventory-items--item_id-">
</span>
<span id="execution-results-PUTapi-v1-inventory-items--item_id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-v1-inventory-items--item_id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-v1-inventory-items--item_id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-v1-inventory-items--item_id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-v1-inventory-items--item_id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-v1-inventory-items--item_id-" data-method="PUT"
      data-path="api/v1/inventory/items/{item_id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-v1-inventory-items--item_id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-v1-inventory-items--item_id-"
                    onclick="tryItOut('PUTapi-v1-inventory-items--item_id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-v1-inventory-items--item_id-"
                    onclick="cancelTryOut('PUTapi-v1-inventory-items--item_id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-v1-inventory-items--item_id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/v1/inventory/items/{item_id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PUTapi-v1-inventory-items--item_id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-v1-inventory-items--item_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-v1-inventory-items--item_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>item_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="item_id"                data-endpoint="PUTapi-v1-inventory-items--item_id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the item. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.name"                data-endpoint="PUTapi-v1-inventory-items--item_id-"
               value="Detergent powder"
               data-component="body">
    <br>
<p>Must be at least 2 characters. Must not be greater than 100 characters. Example: <code>Detergent powder</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>reorderLevel</code></b>&nbsp;&nbsp;
<small>number</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.reorderLevel"                data-endpoint="PUTapi-v1-inventory-items--item_id-"
               value="5"
               data-component="body">
    <br>
<p>Low at or below this; Critical at or below half. Must be at least 0. Example: <code>5</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>isActive</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="PUTapi-v1-inventory-items--item_id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="true"
                   data-endpoint="PUTapi-v1-inventory-items--item_id-"
                   data-component="body"             >
            <code>true</code>
        </label>
        <label data-endpoint="PUTapi-v1-inventory-items--item_id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="false"
                   data-endpoint="PUTapi-v1-inventory-items--item_id-"
                   data-component="body"             >
            <code>false</code>
        </label>
    <br>
<p>Example: <code>true</code></p>
                    </div>
                                    </details>
        </div>
                                                                    <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>relationships</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 28px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>unit</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 42px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 56px; clear: unset;">
                        <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.relationships.unit.data.id"                data-endpoint="PUTapi-v1-inventory-items--item_id-"
               value="1"
               data-component="body">
    <br>
<p>kg 1, L 2, pcs 3, rolls 4. Must match an existing stored value. Example: <code>1</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="inventory-PATCHapi-v1-inventory-items--id-">Update a supply item (fields sent)</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PATCHapi-v1-inventory-items--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PATCH \
    "http://localhost:8000/api/v1/inventory/items/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"name\": \"Detergent powder\",
            \"reorderLevel\": 5,
            \"isActive\": true
        },
        \"relationships\": {
            \"unit\": {
                \"data\": {
                    \"id\": 1
                }
            }
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/inventory/items/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "name": "Detergent powder",
            "reorderLevel": 5,
            "isActive": true
        },
        "relationships": {
            "unit": {
                "data": {
                    "id": 1
                }
            }
        }
    }
};

fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PATCHapi-v1-inventory-items--id-">
</span>
<span id="execution-results-PATCHapi-v1-inventory-items--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PATCHapi-v1-inventory-items--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PATCHapi-v1-inventory-items--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PATCHapi-v1-inventory-items--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PATCHapi-v1-inventory-items--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PATCHapi-v1-inventory-items--id-" data-method="PATCH"
      data-path="api/v1/inventory/items/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PATCHapi-v1-inventory-items--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PATCHapi-v1-inventory-items--id-"
                    onclick="tryItOut('PATCHapi-v1-inventory-items--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PATCHapi-v1-inventory-items--id-"
                    onclick="cancelTryOut('PATCHapi-v1-inventory-items--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PATCHapi-v1-inventory-items--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/v1/inventory/items/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PATCHapi-v1-inventory-items--id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PATCHapi-v1-inventory-items--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PATCHapi-v1-inventory-items--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="PATCHapi-v1-inventory-items--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the item. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.name"                data-endpoint="PATCHapi-v1-inventory-items--id-"
               value="Detergent powder"
               data-component="body">
    <br>
<p>Must be at least 2 characters. Must not be greater than 100 characters. Example: <code>Detergent powder</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>reorderLevel</code></b>&nbsp;&nbsp;
<small>number</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.reorderLevel"                data-endpoint="PATCHapi-v1-inventory-items--id-"
               value="5"
               data-component="body">
    <br>
<p>Low at or below this; Critical at or below half. Must be at least 0. Example: <code>5</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>isActive</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="PATCHapi-v1-inventory-items--id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="true"
                   data-endpoint="PATCHapi-v1-inventory-items--id-"
                   data-component="body"             >
            <code>true</code>
        </label>
        <label data-endpoint="PATCHapi-v1-inventory-items--id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="false"
                   data-endpoint="PATCHapi-v1-inventory-items--id-"
                   data-component="body"             >
            <code>false</code>
        </label>
    <br>
<p>Example: <code>true</code></p>
                    </div>
                                    </details>
        </div>
                                                                    <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>relationships</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 28px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>unit</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 42px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 56px; clear: unset;">
                        <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.relationships.unit.data.id"                data-endpoint="PATCHapi-v1-inventory-items--id-"
               value="1"
               data-component="body">
    <br>
<p>kg 1, L 2, pcs 3, rolls 4. Must match an existing stored value. Example: <code>1</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="inventory-GETapi-v1-inventory-movements">List stock movements</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Newest first.</p>

<span id="example-requests-GETapi-v1-inventory-movements">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/inventory/movements?item=1&amp;type=usage&amp;page=1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/inventory/movements"
);

const params = {
    "item": "1",
    "type": "usage",
    "page": "1",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-inventory-movements">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-inventory-movements" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-inventory-movements"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-inventory-movements"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-inventory-movements" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-inventory-movements">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-inventory-movements" data-method="GET"
      data-path="api/v1/inventory/movements"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-inventory-movements', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-inventory-movements"
                    onclick="tryItOut('GETapi-v1-inventory-movements');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-inventory-movements"
                    onclick="cancelTryOut('GETapi-v1-inventory-movements');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-inventory-movements"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/inventory/movements</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-inventory-movements"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-inventory-movements"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-inventory-movements"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>item</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="item"                data-endpoint="GETapi-v1-inventory-movements"
               value="1"
               data-component="query">
    <br>
<p>One item's movements. Example: <code>1</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>type</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="type"                data-endpoint="GETapi-v1-inventory-movements"
               value="usage"
               data-component="query">
    <br>
<p>in, out, adjust or usage (soap used by orders). Example: <code>usage</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>page</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="page"                data-endpoint="GETapi-v1-inventory-movements"
               value="1"
               data-component="query">
    <br>
<p>The page number. Example: <code>1</code></p>
            </div>
                </form>

                    <h2 id="inventory-POSTapi-v1-inventory-movements">Record a stock movement</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Stock-in and adjustments need inventory.manage (the owner); stock-out also works with
inventory.stock_out. A stock-out cannot exceed what is on hand.</p>

<span id="example-requests-POSTapi-v1-inventory-movements">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/inventory/movements" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"relationships\": {
            \"item\": {
                \"data\": {
                    \"id\": 1
                }
            }
        },
        \"attributes\": {
            \"type\": \"out\",
            \"quantity\": 1.5,
            \"remarks\": \"Used today\"
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/inventory/movements"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "relationships": {
            "item": {
                "data": {
                    "id": 1
                }
            }
        },
        "attributes": {
            "type": "out",
            "quantity": 1.5,
            "remarks": "Used today"
        }
    }
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-inventory-movements">
</span>
<span id="execution-results-POSTapi-v1-inventory-movements" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-inventory-movements"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-inventory-movements"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-inventory-movements" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-inventory-movements">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-inventory-movements" data-method="POST"
      data-path="api/v1/inventory/movements"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-inventory-movements', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-inventory-movements"
                    onclick="tryItOut('POSTapi-v1-inventory-movements');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-inventory-movements"
                    onclick="cancelTryOut('POSTapi-v1-inventory-movements');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-inventory-movements"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/inventory/movements</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-inventory-movements"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-inventory-movements"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-inventory-movements"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>relationships</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 28px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>item</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 42px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 56px; clear: unset;">
                        <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.relationships.item.data.id"                data-endpoint="POSTapi-v1-inventory-movements"
               value="1"
               data-component="body">
    <br>
<p>Must match an existing stored value. Example: <code>1</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
                                                                    <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>type</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.type"                data-endpoint="POSTapi-v1-inventory-movements"
               value="out"
               data-component="body">
    <br>
<p>in, out or adjust (adjust may be negative). Example: <code>out</code></p>
Must be one of:
<ul style="list-style-type: square;"><li><code>in</code></li> <li><code>out</code></li> <li><code>adjust</code></li></ul>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>quantity</code></b>&nbsp;&nbsp;
<small>number</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.quantity"                data-endpoint="POSTapi-v1-inventory-movements"
               value="1.5"
               data-component="body">
    <br>
<p>Example: <code>1.5</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>remarks</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.remarks"                data-endpoint="POSTapi-v1-inventory-movements"
               value="Used today"
               data-component="body">
    <br>
<p>Required for an adjustment. Must not be greater than 255 characters. Example: <code>Used today</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                <h1 id="notifications">Notifications</h1>

    <p>The staff bell: orders ready for pickup and low stock.</p>

                                <h2 id="notifications-GETapi-v1-notifications">List staff notifications</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Newest first. <code>meta.unread</code> counts the unread ones.</p>

<span id="example-requests-GETapi-v1-notifications">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/notifications" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/notifications"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-notifications">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-notifications" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-notifications"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-notifications"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-notifications" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-notifications">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-notifications" data-method="GET"
      data-path="api/v1/notifications"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-notifications', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-notifications"
                    onclick="tryItOut('GETapi-v1-notifications');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-notifications"
                    onclick="cancelTryOut('GETapi-v1-notifications');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-notifications"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/notifications</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-notifications"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-notifications"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-notifications"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="notifications-POSTapi-v1-notifications--notification_id--read">Mark a notification as read</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-POSTapi-v1-notifications--notification_id--read">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/notifications/1/read" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/notifications/1/read"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "POST",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-notifications--notification_id--read">
</span>
<span id="execution-results-POSTapi-v1-notifications--notification_id--read" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-notifications--notification_id--read"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-notifications--notification_id--read"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-notifications--notification_id--read" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-notifications--notification_id--read">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-notifications--notification_id--read" data-method="POST"
      data-path="api/v1/notifications/{notification_id}/read"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-notifications--notification_id--read', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-notifications--notification_id--read"
                    onclick="tryItOut('POSTapi-v1-notifications--notification_id--read');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-notifications--notification_id--read"
                    onclick="cancelTryOut('POSTapi-v1-notifications--notification_id--read');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-notifications--notification_id--read"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/notifications/{notification_id}/read</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-notifications--notification_id--read"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-notifications--notification_id--read"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-notifications--notification_id--read"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>notification_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="notification_id"                data-endpoint="POSTapi-v1-notifications--notification_id--read"
               value="1"
               data-component="url">
    <br>
<p>The ID of the notification. Example: <code>1</code></p>
            </div>
                    </form>

                <h1 id="orders">Orders</h1>

    <p>Laundry transactions: take them in, list and find them, and edit their notes and promised time.</p>

                                <h2 id="orders-GETapi-v1-orders">List orders</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Newest first. <code>meta.statusCounts</code> counts each status over every other filter, so the status
chips show what each would return. Use ?include=customer,baskets,items,receivedBy for the
list rows.</p>

<span id="example-requests-GETapi-v1-orders">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/orders?search=santos&amp;status=received%2Cwashing&amp;paymentStatus=unpaid&amp;receivedAt=2026-11-01%2C2026-11-08&amp;customer=1&amp;waitingMin=3&amp;waitingMax=1&amp;due=overdue&amp;sort=-receivedAt&amp;include=customer%2Cbaskets%2Citems%2CreceivedBy&amp;page=1&amp;perPage=8" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/orders"
);

const params = {
    "search": "santos",
    "status": "received,washing",
    "paymentStatus": "unpaid",
    "receivedAt": "2026-11-01,2026-11-08",
    "customer": "1",
    "waitingMin": "3",
    "waitingMax": "1",
    "due": "overdue",
    "sort": "-receivedAt",
    "include": "customer,baskets,items,receivedBy",
    "page": "1",
    "perPage": "8",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-orders">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-orders" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-orders"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-orders"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-orders" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-orders">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-orders" data-method="GET"
      data-path="api/v1/orders"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-orders', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-orders"
                    onclick="tryItOut('GETapi-v1-orders');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-orders"
                    onclick="cancelTryOut('GETapi-v1-orders');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-orders"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/orders</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-orders"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-orders"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-orders"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>search</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="search"                data-endpoint="GETapi-v1-orders"
               value="santos"
               data-component="query">
    <br>
<p>Order number, basket number, customer name or 3+ phone digits. Example: <code>santos</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>status</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="status"                data-endpoint="GETapi-v1-orders"
               value="received,washing"
               data-component="query">
    <br>
<p>Status codes, comma separated. Example: <code>received,washing</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>paymentStatus</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="paymentStatus"                data-endpoint="GETapi-v1-orders"
               value="unpaid"
               data-component="query">
    <br>
<p>unpaid, partial or paid. Example: <code>unpaid</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>receivedAt</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="receivedAt"                data-endpoint="GETapi-v1-orders"
               value="2026-11-01,2026-11-08"
               data-component="query">
    <br>
<p>A Manila day, or from,to. Example: <code>2026-11-01,2026-11-08</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>customer</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="customer"                data-endpoint="GETapi-v1-orders"
               value="1"
               data-component="query">
    <br>
<p>One customer's orders. Example: <code>1</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>waitingMin</code></b>&nbsp;&nbsp;
<small>number</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="waitingMin"                data-endpoint="GETapi-v1-orders"
               value="3"
               data-component="query">
    <br>
<p>At least this many days in the current status. Example: <code>3</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>waitingMax</code></b>&nbsp;&nbsp;
<small>number</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="waitingMax"                data-endpoint="GETapi-v1-orders"
               value="1"
               data-component="query">
    <br>
<p>Under this many days in the current status. Example: <code>1</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>due</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="due"                data-endpoint="GETapi-v1-orders"
               value="overdue"
               data-component="query">
    <br>
<p>Active orders due on a Manila day, or "overdue". Example: <code>overdue</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>sort</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="sort"                data-endpoint="GETapi-v1-orders"
               value="-receivedAt"
               data-component="query">
    <br>
<p>orderNumber, receivedAt, promisedAt or updatedAt; - for descending. Example: <code>-receivedAt</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>include</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="include"                data-endpoint="GETapi-v1-orders"
               value="customer,baskets,items,receivedBy"
               data-component="query">
    <br>
<p>customer, baskets, items, receivedBy, payments, statusHistory, basketHistory, shop. Example: <code>customer,baskets,items,receivedBy</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>page</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="page"                data-endpoint="GETapi-v1-orders"
               value="1"
               data-component="query">
    <br>
<p>The page number. Example: <code>1</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>perPage</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="perPage"                data-endpoint="GETapi-v1-orders"
               value="8"
               data-component="query">
    <br>
<p>Rows per page (1–500, default 8). Example: <code>8</code></p>
            </div>
                </form>

                    <h2 id="orders-POSTapi-v1-orders">Take in an order</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>One transaction: locked baskets, the day's order number, items with frozen prices, the wash
type with its frozen surcharge and the soap it deducts from stock (409 when the shop blocks
orders on a soap shortage), the first history row, the optional payment, the customer's notice and the audit log.</p>

<span id="example-requests-POSTapi-v1-orders">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/orders" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"items\": [
                {
                    \"serviceId\": 1,
                    \"weightKg\": 6.5
                },
                {
                    \"serviceId\": 4,
                    \"quantity\": 6
                }
            ],
            \"promisedAt\": \"2026-11-09T09:00:00.000Z\",
            \"notes\": \"Separate white uniforms.\",
            \"payment\": {
                \"amountCents\": 20000,
                \"paymentMethod\": \"cash\"
            }
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/orders"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "items": [
                {
                    "serviceId": 1,
                    "weightKg": 6.5
                },
                {
                    "serviceId": 4,
                    "quantity": 6
                }
            ],
            "promisedAt": "2026-11-09T09:00:00.000Z",
            "notes": "Separate white uniforms.",
            "payment": {
                "amountCents": 20000,
                "paymentMethod": "cash"
            }
        }
    }
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-orders">
</span>
<span id="execution-results-POSTapi-v1-orders" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-orders"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-orders"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-orders" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-orders">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-orders" data-method="POST"
      data-path="api/v1/orders"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-orders', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-orders"
                    onclick="tryItOut('POSTapi-v1-orders');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-orders"
                    onclick="cancelTryOut('POSTapi-v1-orders');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-orders"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/orders</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-orders"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-orders"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-orders"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>items</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.items"                data-endpoint="POSTapi-v1-orders"
               value=""
               data-component="body">
    <br>
<p>The service lines: serviceId plus weightKg (per kg) or quantity (per piece).</p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>promisedAt</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.promisedAt"                data-endpoint="POSTapi-v1-orders"
               value="2026-11-09T09:00:00.000Z"
               data-component="body">
    <br>
<p>Estimated completion, ISO-8601. Example: <code>2026-11-09T09:00:00.000Z</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>notes</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.notes"                data-endpoint="POSTapi-v1-orders"
               value="Separate white uniforms."
               data-component="body">
    <br>
<p>Notes for the shop. Must not be greater than 2000 characters. Example: <code>Separate white uniforms.</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>payment</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.payment"                data-endpoint="POSTapi-v1-orders"
               value=""
               data-component="body">
    <br>
<p>Optional payment at drop-off (needs payments.record).</p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="orders-GETapi-v1-orders--id-">Show an order</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Everything the order page needs: lines, baskets, payments, status history and basket history.</p>

<span id="example-requests-GETapi-v1-orders--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/orders/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/orders/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-orders--id-">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-orders--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-orders--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-orders--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-orders--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-orders--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-orders--id-" data-method="GET"
      data-path="api/v1/orders/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-orders--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-orders--id-"
                    onclick="tryItOut('GETapi-v1-orders--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-orders--id-"
                    onclick="cancelTryOut('GETapi-v1-orders--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-orders--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/orders/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-orders--id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-orders--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-orders--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="GETapi-v1-orders--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the order. Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="orders-PUTapi-v1-orders--order_id-">Replace the notes and promised time (both required)</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PUTapi-v1-orders--order_id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/v1/orders/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"notes\": \"Call before pickup.\",
            \"promisedAt\": \"2026-11-09T09:00:00.000Z\"
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/orders/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "notes": "Call before pickup.",
            "promisedAt": "2026-11-09T09:00:00.000Z"
        }
    }
};

fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-v1-orders--order_id-">
</span>
<span id="execution-results-PUTapi-v1-orders--order_id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-v1-orders--order_id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-v1-orders--order_id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-v1-orders--order_id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-v1-orders--order_id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-v1-orders--order_id-" data-method="PUT"
      data-path="api/v1/orders/{order_id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-v1-orders--order_id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-v1-orders--order_id-"
                    onclick="tryItOut('PUTapi-v1-orders--order_id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-v1-orders--order_id-"
                    onclick="cancelTryOut('PUTapi-v1-orders--order_id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-v1-orders--order_id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/v1/orders/{order_id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PUTapi-v1-orders--order_id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-v1-orders--order_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-v1-orders--order_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>order_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="order_id"                data-endpoint="PUTapi-v1-orders--order_id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the order. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>notes</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.notes"                data-endpoint="PUTapi-v1-orders--order_id-"
               value="Call before pickup."
               data-component="body">
    <br>
<p>Must not be greater than 2000 characters. Example: <code>Call before pickup.</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>promisedAt</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.promisedAt"                data-endpoint="PUTapi-v1-orders--order_id-"
               value="2026-11-09T09:00:00.000Z"
               data-component="body">
    <br>
<p>Must be a valid date. Example: <code>2026-11-09T09:00:00.000Z</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="orders-PATCHapi-v1-orders--id-">Update the notes or the promised time</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PATCHapi-v1-orders--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PATCH \
    "http://localhost:8000/api/v1/orders/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"notes\": \"Call before pickup.\",
            \"promisedAt\": \"2026-11-09T09:00:00.000Z\"
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/orders/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "notes": "Call before pickup.",
            "promisedAt": "2026-11-09T09:00:00.000Z"
        }
    }
};

fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PATCHapi-v1-orders--id-">
</span>
<span id="execution-results-PATCHapi-v1-orders--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PATCHapi-v1-orders--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PATCHapi-v1-orders--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PATCHapi-v1-orders--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PATCHapi-v1-orders--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PATCHapi-v1-orders--id-" data-method="PATCH"
      data-path="api/v1/orders/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PATCHapi-v1-orders--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PATCHapi-v1-orders--id-"
                    onclick="tryItOut('PATCHapi-v1-orders--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PATCHapi-v1-orders--id-"
                    onclick="cancelTryOut('PATCHapi-v1-orders--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PATCHapi-v1-orders--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/v1/orders/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PATCHapi-v1-orders--id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PATCHapi-v1-orders--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PATCHapi-v1-orders--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="PATCHapi-v1-orders--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the order. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>notes</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.notes"                data-endpoint="PATCHapi-v1-orders--id-"
               value="Call before pickup."
               data-component="body">
    <br>
<p>Must not be greater than 2000 characters. Example: <code>Call before pickup.</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>promisedAt</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.promisedAt"                data-endpoint="PATCHapi-v1-orders--id-"
               value="2026-11-09T09:00:00.000Z"
               data-component="body">
    <br>
<p>Must be a valid date. Example: <code>2026-11-09T09:00:00.000Z</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="orders-POSTapi-v1-orders--order_id--status">Move an order to another stage</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Forward one stage at a time. An admin may go back one stage with a note. Completed needs a
zero balance and frees the baskets. 409 for a skip, the same status, a balance due, a completed
order or a stale scan; 403 for a move back without orders.revert; 422 for a move back without a note.</p>

<span id="example-requests-POSTapi-v1-orders--order_id--status">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/orders/1/status" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"toStatus\": \"washing\"
        },
        \"relationships\": {
            \"basket\": {
                \"data\": {
                    \"id\": 7
                }
            }
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/orders/1/status"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "toStatus": "washing"
        },
        "relationships": {
            "basket": {
                "data": {
                    "id": 7
                }
            }
        }
    }
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-orders--order_id--status">
</span>
<span id="execution-results-POSTapi-v1-orders--order_id--status" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-orders--order_id--status"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-orders--order_id--status"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-orders--order_id--status" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-orders--order_id--status">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-orders--order_id--status" data-method="POST"
      data-path="api/v1/orders/{order_id}/status"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-orders--order_id--status', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-orders--order_id--status"
                    onclick="tryItOut('POSTapi-v1-orders--order_id--status');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-orders--order_id--status"
                    onclick="cancelTryOut('POSTapi-v1-orders--order_id--status');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-orders--order_id--status"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/orders/{order_id}/status</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-orders--order_id--status"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-orders--order_id--status"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-orders--order_id--status"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>order_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="order_id"                data-endpoint="POSTapi-v1-orders--order_id--status"
               value="1"
               data-component="url">
    <br>
<p>The ID of the order. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>toStatus</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.toStatus"                data-endpoint="POSTapi-v1-orders--order_id--status"
               value="washing"
               data-component="body">
    <br>
<p>received, washing, drying, folding, ready_for_pickup or released (Completed). Example: <code>washing</code></p>
Must be one of:
<ul style="list-style-type: square;"><li><code>received</code></li> <li><code>washing</code></li> <li><code>drying</code></li> <li><code>folding</code></li> <li><code>ready_for_pickup</code></li> <li><code>released</code></li></ul>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>note</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.note"                data-endpoint="POSTapi-v1-orders--order_id--status"
               value=""
               data-component="body">
    <br>
<p>Required when an admin moves an order back. Must not be greater than 255 characters.</p>
                    </div>
                                    </details>
        </div>
                                                                    <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>relationships</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 28px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>basket</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 42px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 56px; clear: unset;">
                        <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.relationships.basket.data.id"                data-endpoint="POSTapi-v1-orders--order_id--status"
               value="7"
               data-component="body">
    <br>
<p>The scanned basket, if any. Example: <code>7</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
                                        </details>
        </div>
        </form>

                <h1 id="payments">Payments</h1>

    <p>The payment log and voiding. Sales are the payments collected, voided ones excluded.</p>

                                <h2 id="payments-POSTapi-v1-orders--order_id--payments">Record a payment on an order</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>The amount cannot exceed the balance; GCash needs its reference number. Answers with the
whole order, so the page shows the new balance at once.</p>

<span id="example-requests-POSTapi-v1-orders--order_id--payments">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/orders/1/payments" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": []
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/orders/1/payments"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": []
    }
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-orders--order_id--payments">
</span>
<span id="execution-results-POSTapi-v1-orders--order_id--payments" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-orders--order_id--payments"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-orders--order_id--payments"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-orders--order_id--payments" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-orders--order_id--payments">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-orders--order_id--payments" data-method="POST"
      data-path="api/v1/orders/{order_id}/payments"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-orders--order_id--payments', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-orders--order_id--payments"
                    onclick="tryItOut('POSTapi-v1-orders--order_id--payments');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-orders--order_id--payments"
                    onclick="cancelTryOut('POSTapi-v1-orders--order_id--payments');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-orders--order_id--payments"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/orders/{order_id}/payments</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-orders--order_id--payments"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-orders--order_id--payments"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-orders--order_id--payments"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>order_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="order_id"                data-endpoint="POSTapi-v1-orders--order_id--payments"
               value="1"
               data-component="url">
    <br>
<p>The ID of the order. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 14px; clear: unset;">
                        <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes"                data-endpoint="POSTapi-v1-orders--order_id--payments"
               value=""
               data-component="body">
    <br>

                    </div>
                                    </details>
        </div>
        </form>

                    <h2 id="payments-GETapi-v1-payments">List payments</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Newest first. <code>meta</code> sums the payments that match the filters, voided ones excluded:
collectedCents, cashCents, gcashCents, mayaCents and count. For the same range it equals the sales
figure on the dashboard and in the reports.</p>

<span id="example-requests-GETapi-v1-payments">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/payments?paidAt=2026-11-01%2C2026-11-08&amp;method=maya&amp;search=OR-0002&amp;voided=&amp;sort=-paidAt&amp;page=1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/payments"
);

const params = {
    "paidAt": "2026-11-01,2026-11-08",
    "method": "maya",
    "search": "OR-0002",
    "voided": "0",
    "sort": "-paidAt",
    "page": "1",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-payments">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-payments" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-payments"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-payments"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-payments" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-payments">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-payments" data-method="GET"
      data-path="api/v1/payments"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-payments', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-payments"
                    onclick="tryItOut('GETapi-v1-payments');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-payments"
                    onclick="cancelTryOut('GETapi-v1-payments');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-payments"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/payments</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-payments"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-payments"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-payments"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>paidAt</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="paidAt"                data-endpoint="GETapi-v1-payments"
               value="2026-11-01,2026-11-08"
               data-component="query">
    <br>
<p>A Manila day, or from,to. Example: <code>2026-11-01,2026-11-08</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>method</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="method"                data-endpoint="GETapi-v1-payments"
               value="maya"
               data-component="query">
    <br>
<p>cash, gcash or maya. Example: <code>maya</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>search</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="search"                data-endpoint="GETapi-v1-payments"
               value="OR-0002"
               data-component="query">
    <br>
<p>Receipt number, order number or customer name. Example: <code>OR-0002</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>voided</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="GETapi-v1-payments" style="display: none">
            <input type="radio" name="voided"
                   value="1"
                   data-endpoint="GETapi-v1-payments"
                   data-component="query"             >
            <code>true</code>
        </label>
        <label data-endpoint="GETapi-v1-payments" style="display: none">
            <input type="radio" name="voided"
                   value="0"
                   data-endpoint="GETapi-v1-payments"
                   data-component="query"             >
            <code>false</code>
        </label>
    <br>
<p>Only voided (true) or valid (false) payments. Example: <code>false</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>sort</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="sort"                data-endpoint="GETapi-v1-payments"
               value="-paidAt"
               data-component="query">
    <br>
<p>paidAt, amountCents or receiptNumber; - for descending. Example: <code>-paidAt</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>page</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="page"                data-endpoint="GETapi-v1-payments"
               value="1"
               data-component="query">
    <br>
<p>The page number. Example: <code>1</code></p>
            </div>
                </form>

                    <h2 id="payments-GETapi-v1-payments--id-">Show a payment</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-v1-payments--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/payments/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/payments/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-payments--id-">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-payments--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-payments--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-payments--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-payments--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-payments--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-payments--id-" data-method="GET"
      data-path="api/v1/payments/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-payments--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-payments--id-"
                    onclick="tryItOut('GETapi-v1-payments--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-payments--id-"
                    onclick="cancelTryOut('GETapi-v1-payments--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-payments--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/payments/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-payments--id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-payments--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-payments--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="GETapi-v1-payments--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the payment. Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="payments-POSTapi-v1-payments--payment_id--void">Void a payment</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Needs a reason. The payment stays on record and no longer counts; the balance re-opens.
Answers 409 on a completed order.</p>

<span id="example-requests-POSTapi-v1-payments--payment_id--void">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/payments/1/void" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"reason\": \"Wrong amount keyed in at the counter\"
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/payments/1/void"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "reason": "Wrong amount keyed in at the counter"
        }
    }
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-payments--payment_id--void">
</span>
<span id="execution-results-POSTapi-v1-payments--payment_id--void" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-payments--payment_id--void"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-payments--payment_id--void"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-payments--payment_id--void" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-payments--payment_id--void">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-payments--payment_id--void" data-method="POST"
      data-path="api/v1/payments/{payment_id}/void"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-payments--payment_id--void', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-payments--payment_id--void"
                    onclick="tryItOut('POSTapi-v1-payments--payment_id--void');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-payments--payment_id--void"
                    onclick="cancelTryOut('POSTapi-v1-payments--payment_id--void');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-payments--payment_id--void"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/payments/{payment_id}/void</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-payments--payment_id--void"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-payments--payment_id--void"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-payments--payment_id--void"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>payment_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="payment_id"                data-endpoint="POSTapi-v1-payments--payment_id--void"
               value="1"
               data-component="url">
    <br>
<p>The ID of the payment. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>reason</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.reason"                data-endpoint="POSTapi-v1-payments--payment_id--void"
               value="Wrong amount keyed in at the counter"
               data-component="body">
    <br>
<p>Must not be greater than 255 characters. Example: <code>Wrong amount keyed in at the counter</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="payments-GETapi-v1-balances">List unpaid balances</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Orders that still owe, Ready for pickup first, then oldest first. <code>meta</code> has the total
outstanding, the number of orders and how many are ready.</p>

<span id="example-requests-GETapi-v1-balances">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/balances?search=santos&amp;include=customer%2Cbaskets%2Citems%2CreceivedBy&amp;page=1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/balances"
);

const params = {
    "search": "santos",
    "include": "customer,baskets,items,receivedBy",
    "page": "1",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-balances">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-balances" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-balances"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-balances"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-balances" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-balances">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-balances" data-method="GET"
      data-path="api/v1/balances"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-balances', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-balances"
                    onclick="tryItOut('GETapi-v1-balances');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-balances"
                    onclick="cancelTryOut('GETapi-v1-balances');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-balances"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/balances</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-balances"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-balances"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-balances"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>search</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="search"                data-endpoint="GETapi-v1-balances"
               value="santos"
               data-component="query">
    <br>
<p>Order number or customer name. Example: <code>santos</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>include</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="include"                data-endpoint="GETapi-v1-balances"
               value="customer,baskets,items,receivedBy"
               data-component="query">
    <br>
<p>As on GET /orders. Example: <code>customer,baskets,items,receivedBy</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>page</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="page"                data-endpoint="GETapi-v1-balances"
               value="1"
               data-component="query">
    <br>
<p>The page number. Example: <code>1</code></p>
            </div>
                </form>

                <h1 id="reports">Reports</h1>

    

                                <h2 id="reports-GETapi-v1-reports--kind-">A report</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>One of seven reports (owner only): sales, orders, payments, services, customers, inventory or
staff. Same envelope as the dashboard analytics, plus a full table. For the same range the
sales total equals the dashboard KPI and GET /payments meta.collectedCents.</p>

<span id="example-requests-GETapi-v1-reports--kind-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/reports/sales?from=2026-10-10&amp;to=2026-11-08&amp;compare=previous&amp;service=1&amp;method=maya&amp;status=ready_for_pickup&amp;staff=2&amp;barangay=Poblacion&amp;item=1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/reports/sales"
);

const params = {
    "from": "2026-10-10",
    "to": "2026-11-08",
    "compare": "previous",
    "service": "1",
    "method": "maya",
    "status": "ready_for_pickup",
    "staff": "2",
    "barangay": "Poblacion",
    "item": "1",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-reports--kind-">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-reports--kind-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-reports--kind-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-reports--kind-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-reports--kind-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-reports--kind-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-reports--kind-" data-method="GET"
      data-path="api/v1/reports/{kind}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-reports--kind-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-reports--kind-"
                    onclick="tryItOut('GETapi-v1-reports--kind-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-reports--kind-"
                    onclick="cancelTryOut('GETapi-v1-reports--kind-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-reports--kind-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/reports/{kind}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-reports--kind-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-reports--kind-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-reports--kind-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>kind</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="kind"                data-endpoint="GETapi-v1-reports--kind-"
               value="sales"
               data-component="url">
    <br>
<p>sales, orders, payments, services, customers, inventory or staff. Example: <code>sales</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>from</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="from"                data-endpoint="GETapi-v1-reports--kind-"
               value="2026-10-10"
               data-component="query">
    <br>
<p>First Manila day (Y-m-d). Example: <code>2026-10-10</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>to</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="to"                data-endpoint="GETapi-v1-reports--kind-"
               value="2026-11-08"
               data-component="query">
    <br>
<p>Last Manila day, inclusive. Example: <code>2026-11-08</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>compare</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="compare"                data-endpoint="GETapi-v1-reports--kind-"
               value="previous"
               data-component="query">
    <br>
<p>previous (default) or none. Example: <code>previous</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>service</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="service"                data-endpoint="GETapi-v1-reports--kind-"
               value="1"
               data-component="query">
    <br>
<p>One service (payments split by allocation). Example: <code>1</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>method</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="method"                data-endpoint="GETapi-v1-reports--kind-"
               value="maya"
               data-component="query">
    <br>
<p>cash, gcash or maya. Example: <code>maya</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>status</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="status"                data-endpoint="GETapi-v1-reports--kind-"
               value="ready_for_pickup"
               data-component="query">
    <br>
<p>One status code. Example: <code>ready_for_pickup</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>staff</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="staff"                data-endpoint="GETapi-v1-reports--kind-"
               value="2"
               data-component="query">
    <br>
<p>One staff member. Example: <code>2</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>barangay</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="barangay"                data-endpoint="GETapi-v1-reports--kind-"
               value="Poblacion"
               data-component="query">
    <br>
<p>One barangay by name. Example: <code>Poblacion</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>item</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="item"                data-endpoint="GETapi-v1-reports--kind-"
               value="1"
               data-component="query">
    <br>
<p>One supply item. Example: <code>1</code></p>
            </div>
                </form>

                <h1 id="services">Services</h1>

    <p>The price list. Changing a rate never changes old orders: their prices were frozen.</p>

                                <h2 id="services-GETapi-v1-services">List services</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-v1-services">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/services?active=1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/services"
);

const params = {
    "active": "1",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-services">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-services" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-services"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-services"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-services" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-services">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-services" data-method="GET"
      data-path="api/v1/services"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-services', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-services"
                    onclick="tryItOut('GETapi-v1-services');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-services"
                    onclick="cancelTryOut('GETapi-v1-services');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-services"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/services</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-services"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-services"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-services"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>active</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="GETapi-v1-services" style="display: none">
            <input type="radio" name="active"
                   value="1"
                   data-endpoint="GETapi-v1-services"
                   data-component="query"             >
            <code>true</code>
        </label>
        <label data-endpoint="GETapi-v1-services" style="display: none">
            <input type="radio" name="active"
                   value="0"
                   data-endpoint="GETapi-v1-services"
                   data-component="query"             >
            <code>false</code>
        </label>
    <br>
<p>Only active (1) or inactive (0) services. Example: <code>true</code></p>
            </div>
                </form>

                    <h2 id="services-POSTapi-v1-services">Add a service</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-POSTapi-v1-services">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/services" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"name\": \"Wash-Dry-Fold\",
            \"description\": \"Regular, 24-hour turnaround\",
            \"pricingType\": \"per_kg\",
            \"rateCents\": 3500,
            \"minimumQty\": 3,
            \"isActive\": true
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/services"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "name": "Wash-Dry-Fold",
            "description": "Regular, 24-hour turnaround",
            "pricingType": "per_kg",
            "rateCents": 3500,
            "minimumQty": 3,
            "isActive": true
        }
    }
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-services">
</span>
<span id="execution-results-POSTapi-v1-services" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-services"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-services"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-services" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-services">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-services" data-method="POST"
      data-path="api/v1/services"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-services', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-services"
                    onclick="tryItOut('POSTapi-v1-services');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-services"
                    onclick="cancelTryOut('POSTapi-v1-services');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-services"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/services</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-services"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-services"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-services"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.name"                data-endpoint="POSTapi-v1-services"
               value="Wash-Dry-Fold"
               data-component="body">
    <br>
<p>Must be at least 2 characters. Must not be greater than 100 characters. Example: <code>Wash-Dry-Fold</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>description</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.description"                data-endpoint="POSTapi-v1-services"
               value="Regular, 24-hour turnaround"
               data-component="body">
    <br>
<p>Must not be greater than 255 characters. Example: <code>Regular, 24-hour turnaround</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>pricingType</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.pricingType"                data-endpoint="POSTapi-v1-services"
               value="per_kg"
               data-component="body">
    <br>
<p>per_kg, per_piece or flat. Example: <code>per_kg</code></p>
Must be one of:
<ul style="list-style-type: square;"><li><code>per_kg</code></li> <li><code>per_piece</code></li> <li><code>flat</code></li></ul>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>rateCents</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.rateCents"                data-endpoint="POSTapi-v1-services"
               value="3500"
               data-component="body">
    <br>
<p>Centavos per kg, per piece or per order. Must be at least 1. Example: <code>3500</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>minimumQty</code></b>&nbsp;&nbsp;
<small>number</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.minimumQty"                data-endpoint="POSTapi-v1-services"
               value="3"
               data-component="body">
    <br>
<p>Minimum billable kilograms (per_kg only). Must be at least 0. Example: <code>3</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>isActive</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="POSTapi-v1-services" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="true"
                   data-endpoint="POSTapi-v1-services"
                   data-component="body"             >
            <code>true</code>
        </label>
        <label data-endpoint="POSTapi-v1-services" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="false"
                   data-endpoint="POSTapi-v1-services"
                   data-component="body"             >
            <code>false</code>
        </label>
    <br>
<p>Example: <code>true</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="services-GETapi-v1-services--id-">Show a service</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-v1-services--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/services/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/services/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-services--id-">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-services--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-services--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-services--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-services--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-services--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-services--id-" data-method="GET"
      data-path="api/v1/services/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-services--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-services--id-"
                    onclick="tryItOut('GETapi-v1-services--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-services--id-"
                    onclick="cancelTryOut('GETapi-v1-services--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-services--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/services/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-services--id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-services--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-services--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="GETapi-v1-services--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the service. Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="services-PUTapi-v1-services--service_id-">Replace a service (every field)</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PUTapi-v1-services--service_id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/v1/services/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"name\": \"Wash-Dry-Fold\",
            \"description\": \"Regular, 24-hour turnaround\",
            \"pricingType\": \"per_kg\",
            \"rateCents\": 3500,
            \"minimumQty\": 3,
            \"isActive\": true
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/services/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "name": "Wash-Dry-Fold",
            "description": "Regular, 24-hour turnaround",
            "pricingType": "per_kg",
            "rateCents": 3500,
            "minimumQty": 3,
            "isActive": true
        }
    }
};

fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-v1-services--service_id-">
</span>
<span id="execution-results-PUTapi-v1-services--service_id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-v1-services--service_id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-v1-services--service_id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-v1-services--service_id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-v1-services--service_id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-v1-services--service_id-" data-method="PUT"
      data-path="api/v1/services/{service_id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-v1-services--service_id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-v1-services--service_id-"
                    onclick="tryItOut('PUTapi-v1-services--service_id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-v1-services--service_id-"
                    onclick="cancelTryOut('PUTapi-v1-services--service_id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-v1-services--service_id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/v1/services/{service_id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PUTapi-v1-services--service_id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-v1-services--service_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-v1-services--service_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>service_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="service_id"                data-endpoint="PUTapi-v1-services--service_id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the service. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.name"                data-endpoint="PUTapi-v1-services--service_id-"
               value="Wash-Dry-Fold"
               data-component="body">
    <br>
<p>Must be at least 2 characters. Must not be greater than 100 characters. Example: <code>Wash-Dry-Fold</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>description</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.description"                data-endpoint="PUTapi-v1-services--service_id-"
               value="Regular, 24-hour turnaround"
               data-component="body">
    <br>
<p>Must not be greater than 255 characters. Example: <code>Regular, 24-hour turnaround</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>pricingType</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.pricingType"                data-endpoint="PUTapi-v1-services--service_id-"
               value="per_kg"
               data-component="body">
    <br>
<p>per_kg, per_piece or flat. Example: <code>per_kg</code></p>
Must be one of:
<ul style="list-style-type: square;"><li><code>per_kg</code></li> <li><code>per_piece</code></li> <li><code>flat</code></li></ul>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>rateCents</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.rateCents"                data-endpoint="PUTapi-v1-services--service_id-"
               value="3500"
               data-component="body">
    <br>
<p>Centavos per kg, per piece or per order. Must be at least 1. Example: <code>3500</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>minimumQty</code></b>&nbsp;&nbsp;
<small>number</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.minimumQty"                data-endpoint="PUTapi-v1-services--service_id-"
               value="3"
               data-component="body">
    <br>
<p>Minimum billable kilograms (per_kg only). Must be at least 0. Example: <code>3</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>isActive</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="PUTapi-v1-services--service_id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="true"
                   data-endpoint="PUTapi-v1-services--service_id-"
                   data-component="body"             >
            <code>true</code>
        </label>
        <label data-endpoint="PUTapi-v1-services--service_id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="false"
                   data-endpoint="PUTapi-v1-services--service_id-"
                   data-component="body"             >
            <code>false</code>
        </label>
    <br>
<p>Example: <code>true</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="services-PATCHapi-v1-services--id-">Update a service (fields sent)</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PATCHapi-v1-services--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PATCH \
    "http://localhost:8000/api/v1/services/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"name\": \"Wash-Dry-Fold\",
            \"description\": \"Regular, 24-hour turnaround\",
            \"pricingType\": \"per_kg\",
            \"rateCents\": 3500,
            \"minimumQty\": 3,
            \"isActive\": true
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/services/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "name": "Wash-Dry-Fold",
            "description": "Regular, 24-hour turnaround",
            "pricingType": "per_kg",
            "rateCents": 3500,
            "minimumQty": 3,
            "isActive": true
        }
    }
};

fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PATCHapi-v1-services--id-">
</span>
<span id="execution-results-PATCHapi-v1-services--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PATCHapi-v1-services--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PATCHapi-v1-services--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PATCHapi-v1-services--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PATCHapi-v1-services--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PATCHapi-v1-services--id-" data-method="PATCH"
      data-path="api/v1/services/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PATCHapi-v1-services--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PATCHapi-v1-services--id-"
                    onclick="tryItOut('PATCHapi-v1-services--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PATCHapi-v1-services--id-"
                    onclick="cancelTryOut('PATCHapi-v1-services--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PATCHapi-v1-services--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/v1/services/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PATCHapi-v1-services--id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PATCHapi-v1-services--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PATCHapi-v1-services--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="PATCHapi-v1-services--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the service. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.name"                data-endpoint="PATCHapi-v1-services--id-"
               value="Wash-Dry-Fold"
               data-component="body">
    <br>
<p>Must be at least 2 characters. Must not be greater than 100 characters. Example: <code>Wash-Dry-Fold</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>description</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.description"                data-endpoint="PATCHapi-v1-services--id-"
               value="Regular, 24-hour turnaround"
               data-component="body">
    <br>
<p>Must not be greater than 255 characters. Example: <code>Regular, 24-hour turnaround</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>pricingType</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.pricingType"                data-endpoint="PATCHapi-v1-services--id-"
               value="per_kg"
               data-component="body">
    <br>
<p>per_kg, per_piece or flat. Example: <code>per_kg</code></p>
Must be one of:
<ul style="list-style-type: square;"><li><code>per_kg</code></li> <li><code>per_piece</code></li> <li><code>flat</code></li></ul>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>rateCents</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.rateCents"                data-endpoint="PATCHapi-v1-services--id-"
               value="3500"
               data-component="body">
    <br>
<p>Centavos per kg, per piece or per order. Must be at least 1. Example: <code>3500</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>minimumQty</code></b>&nbsp;&nbsp;
<small>number</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.minimumQty"                data-endpoint="PATCHapi-v1-services--id-"
               value="3"
               data-component="body">
    <br>
<p>Minimum billable kilograms (per_kg only). Must be at least 0. Example: <code>3</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>isActive</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="PATCHapi-v1-services--id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="true"
                   data-endpoint="PATCHapi-v1-services--id-"
                   data-component="body"             >
            <code>true</code>
        </label>
        <label data-endpoint="PATCHapi-v1-services--id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="false"
                   data-endpoint="PATCHapi-v1-services--id-"
                   data-component="body"             >
            <code>false</code>
        </label>
    <br>
<p>Example: <code>true</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                <h1 id="settings">Settings</h1>

    <p>The shop profile: a single record, replaced as a whole (PUT).</p>

                                <h2 id="settings-GETapi-v1-settings-shop">Shop profile</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-v1-settings-shop">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/settings/shop" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/settings/shop"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-settings-shop">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-settings-shop" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-settings-shop"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-settings-shop"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-settings-shop" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-settings-shop">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-settings-shop" data-method="GET"
      data-path="api/v1/settings/shop"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-settings-shop', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-settings-shop"
                    onclick="tryItOut('GETapi-v1-settings-shop');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-settings-shop"
                    onclick="cancelTryOut('GETapi-v1-settings-shop');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-settings-shop"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/settings/shop</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-settings-shop"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-settings-shop"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-settings-shop"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="settings-PUTapi-v1-settings-shop">Replace the shop profile</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PUTapi-v1-settings-shop">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/v1/settings/shop" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/settings/shop"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "PUT",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-v1-settings-shop">
</span>
<span id="execution-results-PUTapi-v1-settings-shop" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-v1-settings-shop"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-v1-settings-shop"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-v1-settings-shop" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-v1-settings-shop">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-v1-settings-shop" data-method="PUT"
      data-path="api/v1/settings/shop"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-v1-settings-shop', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-v1-settings-shop"
                    onclick="tryItOut('PUTapi-v1-settings-shop');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-v1-settings-shop"
                    onclick="cancelTryOut('PUTapi-v1-settings-shop');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-v1-settings-shop"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/v1/settings/shop</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PUTapi-v1-settings-shop"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-v1-settings-shop"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-v1-settings-shop"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.name"                data-endpoint="PUTapi-v1-settings-shop"
               value="LaundryFlow"
               data-component="body">
    <br>
<p>Example: <code>LaundryFlow</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>address</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.address"                data-endpoint="PUTapi-v1-settings-shop"
               value="Brgy. Poblacion, Bongabong, Oriental Mindoro"
               data-component="body">
    <br>
<p>Example: <code>Brgy. Poblacion, Bongabong, Oriental Mindoro</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>contactNumber</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.contactNumber"                data-endpoint="PUTapi-v1-settings-shop"
               value="0917 555 0101"
               data-component="body">
    <br>
<p>Example: <code>0917 555 0101</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>openingHours</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.openingHours"                data-endpoint="PUTapi-v1-settings-shop"
               value="Open daily 7:00 AM – 7:00 PM"
               data-component="body">
    <br>
<p>Example: <code>Open daily 7:00 AM – 7:00 PM</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>receiptFooter</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.receiptFooter"                data-endpoint="PUTapi-v1-settings-shop"
               value="Salamat po!"
               data-component="body">
    <br>
<p>The closing note of every order summary. Example: <code>Salamat po!</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>claimPolicyDays</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.claimPolicyDays"                data-endpoint="PUTapi-v1-settings-shop"
               value="30"
               data-component="body">
    <br>
<p>Example: <code>30</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="settings-PUTapi-v1-settings-stock-rule">Set the soap stock rule</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PUTapi-v1-settings-stock-rule">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/v1/settings/stock-rule" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/settings/stock-rule"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "PUT",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-v1-settings-stock-rule">
</span>
<span id="execution-results-PUTapi-v1-settings-stock-rule" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-v1-settings-stock-rule"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-v1-settings-stock-rule"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-v1-settings-stock-rule" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-v1-settings-stock-rule">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-v1-settings-stock-rule" data-method="PUT"
      data-path="api/v1/settings/stock-rule"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-v1-settings-stock-rule', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-v1-settings-stock-rule"
                    onclick="tryItOut('PUTapi-v1-settings-stock-rule');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-v1-settings-stock-rule"
                    onclick="cancelTryOut('PUTapi-v1-settings-stock-rule');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-v1-settings-stock-rule"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/v1/settings/stock-rule</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PUTapi-v1-settings-stock-rule"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-v1-settings-stock-rule"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-v1-settings-stock-rule"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>blockOrdersOnLowSoap</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
 &nbsp;
 &nbsp;
                <label data-endpoint="PUTapi-v1-settings-stock-rule" style="display: none">
            <input type="radio" name="data.attributes.blockOrdersOnLowSoap"
                   value="true"
                   data-endpoint="PUTapi-v1-settings-stock-rule"
                   data-component="body"             >
            <code>true</code>
        </label>
        <label data-endpoint="PUTapi-v1-settings-stock-rule" style="display: none">
            <input type="radio" name="data.attributes.blockOrdersOnLowSoap"
                   value="false"
                   data-endpoint="PUTapi-v1-settings-stock-rule"
                   data-component="body"             >
            <code>false</code>
        </label>
    <br>
<p>Example: <code>false</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="settings-GETapi-v1-activity-logs">Activity log</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Who did what, newest first, with a readable summary and the values before and after.</p>

<span id="example-requests-GETapi-v1-activity-logs">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/activity-logs?user=2&amp;entity=order&amp;action=LF-26&amp;createdAt=2026-11-01%2C2026-11-08" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/activity-logs"
);

const params = {
    "user": "2",
    "entity": "order",
    "action": "LF-26",
    "createdAt": "2026-11-01,2026-11-08",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-activity-logs">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-activity-logs" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-activity-logs"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-activity-logs"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-activity-logs" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-activity-logs">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-activity-logs" data-method="GET"
      data-path="api/v1/activity-logs"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-activity-logs', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-activity-logs"
                    onclick="tryItOut('GETapi-v1-activity-logs');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-activity-logs"
                    onclick="cancelTryOut('GETapi-v1-activity-logs');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-activity-logs"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/activity-logs</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-activity-logs"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-activity-logs"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-activity-logs"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>user</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="user"                data-endpoint="GETapi-v1-activity-logs"
               value="2"
               data-component="query">
    <br>
<p>One staff member. Example: <code>2</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>entity</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="entity"                data-endpoint="GETapi-v1-activity-logs"
               value="order"
               data-component="query">
    <br>
<p>order, payment, customer, basket, service, inventory_item, user, role, shop_settings. Example: <code>order</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>action</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="action"                data-endpoint="GETapi-v1-activity-logs"
               value="LF-26"
               data-component="query">
    <br>
<p>Text in the action or its values. Example: <code>LF-26</code></p>
            </div>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>createdAt</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="createdAt"                data-endpoint="GETapi-v1-activity-logs"
               value="2026-11-01,2026-11-08"
               data-component="query">
    <br>
<p>A Manila day, or from,to. Example: <code>2026-11-01,2026-11-08</code></p>
            </div>
                </form>

                <h1 id="users">Users</h1>

    <p>Staff accounts, managed by the owner (course L23). Users are never deleted: disabling keeps
their name on the history they made.</p>

                                <h2 id="users-GETapi-v1-users">List staff users</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-v1-users">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/users" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/users"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-users">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-users" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-users"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-users"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-users" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-users">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-users" data-method="GET"
      data-path="api/v1/users"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-users', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-users"
                    onclick="tryItOut('GETapi-v1-users');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-users"
                    onclick="cancelTryOut('GETapi-v1-users');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-users"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/users</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-users"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-users"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-users"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="users-POSTapi-v1-users">Add a staff user</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-POSTapi-v1-users">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/users" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"name\": \"Rico Santos\",
            \"username\": \"rico.s\",
            \"role\": \"staff\",
            \"password\": \"password123\",
            \"isActive\": true
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/users"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "name": "Rico Santos",
            "username": "rico.s",
            "role": "staff",
            "password": "password123",
            "isActive": true
        }
    }
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-users">
</span>
<span id="execution-results-POSTapi-v1-users" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-users"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-users"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-users" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-users">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-users" data-method="POST"
      data-path="api/v1/users"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-users', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-users"
                    onclick="tryItOut('POSTapi-v1-users');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-users"
                    onclick="cancelTryOut('POSTapi-v1-users');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-users"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/users</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-users"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-users"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-users"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.name"                data-endpoint="POSTapi-v1-users"
               value="Rico Santos"
               data-component="body">
    <br>
<p>Must be at least 2 characters. Must not be greater than 255 characters. Example: <code>Rico Santos</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>username</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.username"                data-endpoint="POSTapi-v1-users"
               value="rico.s"
               data-component="body">
    <br>
<p>Lower-case letters, digits, dots, dashes. Must match the regex /^[a-z0-9._-]{3,}$/. Must not be greater than 50 characters. Example: <code>rico.s</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>role</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.role"                data-endpoint="POSTapi-v1-users"
               value="staff"
               data-component="body">
    <br>
<p>admin or staff. Example: <code>staff</code></p>
Must be one of:
<ul style="list-style-type: square;"><li><code>admin</code></li> <li><code>staff</code></li></ul>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>password</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.password"                data-endpoint="POSTapi-v1-users"
               value="password123"
               data-component="body">
    <br>
<p>At least 8 characters. Must be at least 8 characters. Example: <code>password123</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>isActive</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="POSTapi-v1-users" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="true"
                   data-endpoint="POSTapi-v1-users"
                   data-component="body"             >
            <code>true</code>
        </label>
        <label data-endpoint="POSTapi-v1-users" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="false"
                   data-endpoint="POSTapi-v1-users"
                   data-component="body"             >
            <code>false</code>
        </label>
    <br>
<p>true re-enables a disabled account. Example: <code>true</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="users-GETapi-v1-users--id-">Show a staff user</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-v1-users--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/users/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/users/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-users--id-">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-users--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-users--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-users--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-users--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-users--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-users--id-" data-method="GET"
      data-path="api/v1/users/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-users--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-users--id-"
                    onclick="tryItOut('GETapi-v1-users--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-users--id-"
                    onclick="cancelTryOut('GETapi-v1-users--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-users--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/users/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-users--id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-users--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-users--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="GETapi-v1-users--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the user. Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="users-PUTapi-v1-users--user_id-">Replace a staff user (name, username and role)</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PUTapi-v1-users--user_id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/v1/users/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"name\": \"Rico Santos\",
            \"username\": \"rico.s\",
            \"role\": \"staff\",
            \"password\": \"password123\",
            \"isActive\": true
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/users/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "name": "Rico Santos",
            "username": "rico.s",
            "role": "staff",
            "password": "password123",
            "isActive": true
        }
    }
};

fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-v1-users--user_id-">
</span>
<span id="execution-results-PUTapi-v1-users--user_id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-v1-users--user_id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-v1-users--user_id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-v1-users--user_id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-v1-users--user_id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-v1-users--user_id-" data-method="PUT"
      data-path="api/v1/users/{user_id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-v1-users--user_id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-v1-users--user_id-"
                    onclick="tryItOut('PUTapi-v1-users--user_id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-v1-users--user_id-"
                    onclick="cancelTryOut('PUTapi-v1-users--user_id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-v1-users--user_id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/v1/users/{user_id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PUTapi-v1-users--user_id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-v1-users--user_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-v1-users--user_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>user_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="user_id"                data-endpoint="PUTapi-v1-users--user_id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the user. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.name"                data-endpoint="PUTapi-v1-users--user_id-"
               value="Rico Santos"
               data-component="body">
    <br>
<p>Must be at least 2 characters. Must not be greater than 255 characters. Example: <code>Rico Santos</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>username</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.username"                data-endpoint="PUTapi-v1-users--user_id-"
               value="rico.s"
               data-component="body">
    <br>
<p>Lower-case letters, digits, dots, dashes. Must match the regex /^[a-z0-9._-]{3,}$/. Must not be greater than 50 characters. Example: <code>rico.s</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>role</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.role"                data-endpoint="PUTapi-v1-users--user_id-"
               value="staff"
               data-component="body">
    <br>
<p>admin or staff. Example: <code>staff</code></p>
Must be one of:
<ul style="list-style-type: square;"><li><code>admin</code></li> <li><code>staff</code></li></ul>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>password</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.password"                data-endpoint="PUTapi-v1-users--user_id-"
               value="password123"
               data-component="body">
    <br>
<p>At least 8 characters. Must be at least 8 characters. Example: <code>password123</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>isActive</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="PUTapi-v1-users--user_id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="true"
                   data-endpoint="PUTapi-v1-users--user_id-"
                   data-component="body"             >
            <code>true</code>
        </label>
        <label data-endpoint="PUTapi-v1-users--user_id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="false"
                   data-endpoint="PUTapi-v1-users--user_id-"
                   data-component="body"             >
            <code>false</code>
        </label>
    <br>
<p>true re-enables a disabled account. Example: <code>true</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="users-PATCHapi-v1-users--id-">Update a staff user (fields sent; isActive true re-enables)</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PATCHapi-v1-users--id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PATCH \
    "http://localhost:8000/api/v1/users/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"name\": \"Rico Santos\",
            \"username\": \"rico.s\",
            \"role\": \"staff\",
            \"password\": \"password123\",
            \"isActive\": true
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/users/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "name": "Rico Santos",
            "username": "rico.s",
            "role": "staff",
            "password": "password123",
            "isActive": true
        }
    }
};

fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PATCHapi-v1-users--id-">
</span>
<span id="execution-results-PATCHapi-v1-users--id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PATCHapi-v1-users--id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PATCHapi-v1-users--id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PATCHapi-v1-users--id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PATCHapi-v1-users--id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PATCHapi-v1-users--id-" data-method="PATCH"
      data-path="api/v1/users/{id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PATCHapi-v1-users--id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PATCHapi-v1-users--id-"
                    onclick="tryItOut('PATCHapi-v1-users--id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PATCHapi-v1-users--id-"
                    onclick="cancelTryOut('PATCHapi-v1-users--id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PATCHapi-v1-users--id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/v1/users/{id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PATCHapi-v1-users--id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PATCHapi-v1-users--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PATCHapi-v1-users--id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="id"                data-endpoint="PATCHapi-v1-users--id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the user. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.name"                data-endpoint="PATCHapi-v1-users--id-"
               value="Rico Santos"
               data-component="body">
    <br>
<p>Must be at least 2 characters. Must not be greater than 255 characters. Example: <code>Rico Santos</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>username</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.username"                data-endpoint="PATCHapi-v1-users--id-"
               value="rico.s"
               data-component="body">
    <br>
<p>Lower-case letters, digits, dots, dashes. Must match the regex /^[a-z0-9._-]{3,}$/. Must not be greater than 50 characters. Example: <code>rico.s</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>role</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.role"                data-endpoint="PATCHapi-v1-users--id-"
               value="staff"
               data-component="body">
    <br>
<p>admin or staff. Example: <code>staff</code></p>
Must be one of:
<ul style="list-style-type: square;"><li><code>admin</code></li> <li><code>staff</code></li></ul>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>password</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.password"                data-endpoint="PATCHapi-v1-users--id-"
               value="password123"
               data-component="body">
    <br>
<p>At least 8 characters. Must be at least 8 characters. Example: <code>password123</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>isActive</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="PATCHapi-v1-users--id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="true"
                   data-endpoint="PATCHapi-v1-users--id-"
                   data-component="body"             >
            <code>true</code>
        </label>
        <label data-endpoint="PATCHapi-v1-users--id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="false"
                   data-endpoint="PATCHapi-v1-users--id-"
                   data-component="body"             >
            <code>false</code>
        </label>
    <br>
<p>true re-enables a disabled account. Example: <code>true</code></p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="users-POSTapi-v1-users--user_id--disable">Disable a staff user</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>The account can no longer sign in, and its tokens stop working at once. Not your own account.</p>

<span id="example-requests-POSTapi-v1-users--user_id--disable">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/users/1/disable" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/users/1/disable"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "POST",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-users--user_id--disable">
</span>
<span id="execution-results-POSTapi-v1-users--user_id--disable" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-users--user_id--disable"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-users--user_id--disable"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-users--user_id--disable" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-users--user_id--disable">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-users--user_id--disable" data-method="POST"
      data-path="api/v1/users/{user_id}/disable"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-users--user_id--disable', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-users--user_id--disable"
                    onclick="tryItOut('POSTapi-v1-users--user_id--disable');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-users--user_id--disable"
                    onclick="cancelTryOut('POSTapi-v1-users--user_id--disable');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-users--user_id--disable"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/users/{user_id}/disable</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-users--user_id--disable"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-users--user_id--disable"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-users--user_id--disable"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>user_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="user_id"                data-endpoint="POSTapi-v1-users--user_id--disable"
               value="1"
               data-component="url">
    <br>
<p>The ID of the user. Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="users-POSTapi-v1-users--user_id--reset-password">Reset a staff user&#039;s password</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>Returns a temporary password, once. Only its hash is stored. The user must choose a new
password at their next sign-in: until then every route but <code>me</code>, <code>logout</code>, <code>refresh</code> and
<code>PUT /auth/password</code> answers 403.</p>

<span id="example-requests-POSTapi-v1-users--user_id--reset-password">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/users/1/reset-password" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/users/1/reset-password"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "POST",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-users--user_id--reset-password">
</span>
<span id="execution-results-POSTapi-v1-users--user_id--reset-password" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-users--user_id--reset-password"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-users--user_id--reset-password"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-users--user_id--reset-password" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-users--user_id--reset-password">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-users--user_id--reset-password" data-method="POST"
      data-path="api/v1/users/{user_id}/reset-password"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-users--user_id--reset-password', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-users--user_id--reset-password"
                    onclick="tryItOut('POSTapi-v1-users--user_id--reset-password');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-users--user_id--reset-password"
                    onclick="cancelTryOut('POSTapi-v1-users--user_id--reset-password');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-users--user_id--reset-password"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/users/{user_id}/reset-password</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-users--user_id--reset-password"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-users--user_id--reset-password"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-users--user_id--reset-password"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>user_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="user_id"                data-endpoint="POSTapi-v1-users--user_id--reset-password"
               value="1"
               data-component="url">
    <br>
<p>The ID of the user. Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="users-GETapi-v1-roles-permissions">Staff permissions</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-v1-roles-permissions">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/roles/permissions" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/roles/permissions"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-roles-permissions">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-roles-permissions" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-roles-permissions"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-roles-permissions"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-roles-permissions" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-roles-permissions">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-roles-permissions" data-method="GET"
      data-path="api/v1/roles/permissions"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-roles-permissions', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-roles-permissions"
                    onclick="tryItOut('GETapi-v1-roles-permissions');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-roles-permissions"
                    onclick="cancelTryOut('GETapi-v1-roles-permissions');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-roles-permissions"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/roles/permissions</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-roles-permissions"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-roles-permissions"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-roles-permissions"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        </form>

                    <h2 id="users-PUTapi-v1-roles-staff-permissions">Replace the staff permissions</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>The whole set at once (PUT). Unknown codes are ignored. Turning one off takes effect
immediately; a newly granted one arrives with each staff member's next sign-in or refresh.</p>

<span id="example-requests-PUTapi-v1-roles-staff-permissions">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/v1/roles/staff/permissions" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/roles/staff/permissions"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "PUT",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-v1-roles-staff-permissions">
</span>
<span id="execution-results-PUTapi-v1-roles-staff-permissions" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-v1-roles-staff-permissions"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-v1-roles-staff-permissions"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-v1-roles-staff-permissions" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-v1-roles-staff-permissions">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-v1-roles-staff-permissions" data-method="PUT"
      data-path="api/v1/roles/staff/permissions"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-v1-roles-staff-permissions', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-v1-roles-staff-permissions"
                    onclick="tryItOut('PUTapi-v1-roles-staff-permissions');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-v1-roles-staff-permissions"
                    onclick="cancelTryOut('PUTapi-v1-roles-staff-permissions');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-v1-roles-staff-permissions"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/v1/roles/staff/permissions</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PUTapi-v1-roles-staff-permissions"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-v1-roles-staff-permissions"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-v1-roles-staff-permissions"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>permissions</code></b>&nbsp;&nbsp;
<small>string[]</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.permissions[0]"                data-endpoint="PUTapi-v1-roles-staff-permissions"
               data-component="body">
        <input type="text" style="display: none"
               name="data.attributes.permissions[1]"                data-endpoint="PUTapi-v1-roles-staff-permissions"
               data-component="body">
    <br>
<p>The codes to switch on.</p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                <h1 id="wash-types">Wash types</h1>

    <p>How the laundry is washed, with the optional surcharge per kilo and the soaps each one uses.
Staff read them to take orders; only the owner changes them (Settings &gt; Pricing &amp; Usage).
Changes apply to new orders only: an order freezes its wash type surcharge when it is made.</p>

                                <h2 id="wash-types-GETapi-v1-wash-types">List wash types</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>

<p>In the order they are shown (sortOrder). <code>meta.blockOrdersOnLowSoap</code> is the shop's stock rule.</p>

<span id="example-requests-GETapi-v1-wash-types">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/wash-types?active=1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/wash-types"
);

const params = {
    "active": "1",
};
Object.keys(params)
    .forEach(key =&gt; url.searchParams.append(key, params[key]));

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-wash-types">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-wash-types" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-wash-types"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-wash-types"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-wash-types" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-wash-types">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-wash-types" data-method="GET"
      data-path="api/v1/wash-types"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-wash-types', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-wash-types"
                    onclick="tryItOut('GETapi-v1-wash-types');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-wash-types"
                    onclick="cancelTryOut('GETapi-v1-wash-types');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-wash-types"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/wash-types</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-wash-types"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-wash-types"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-wash-types"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Query Parameters</b></h4>
                                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>active</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="GETapi-v1-wash-types" style="display: none">
            <input type="radio" name="active"
                   value="1"
                   data-endpoint="GETapi-v1-wash-types"
                   data-component="query"             >
            <code>true</code>
        </label>
        <label data-endpoint="GETapi-v1-wash-types" style="display: none">
            <input type="radio" name="active"
                   value="0"
                   data-endpoint="GETapi-v1-wash-types"
                   data-component="query"             >
            <code>false</code>
        </label>
    <br>
<p>Only active (1) or inactive (0) wash types. Example: <code>true</code></p>
            </div>
                </form>

                    <h2 id="wash-types-POSTapi-v1-wash-types">Add a wash type</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-POSTapi-v1-wash-types">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request POST \
    "http://localhost:8000/api/v1/wash-types" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"name\": \"Tough stains\",
            \"description\": \"Heavy-duty treatment for stubborn stains.\",
            \"surchargePerKgCents\": 500,
            \"sortOrder\": 5,
            \"isActive\": true,
            \"supplies\": [
                {
                    \"inventoryItemId\": 6,
                    \"usagePerKgSmallUnit\": 0.25
                }
            ]
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/wash-types"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "name": "Tough stains",
            "description": "Heavy-duty treatment for stubborn stains.",
            "surchargePerKgCents": 500,
            "sortOrder": 5,
            "isActive": true,
            "supplies": [
                {
                    "inventoryItemId": 6,
                    "usagePerKgSmallUnit": 0.25
                }
            ]
        }
    }
};

fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-POSTapi-v1-wash-types">
</span>
<span id="execution-results-POSTapi-v1-wash-types" hidden>
    <blockquote>Received response<span
                id="execution-response-status-POSTapi-v1-wash-types"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-POSTapi-v1-wash-types"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-POSTapi-v1-wash-types" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-POSTapi-v1-wash-types">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-POSTapi-v1-wash-types" data-method="POST"
      data-path="api/v1/wash-types"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('POSTapi-v1-wash-types', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-POSTapi-v1-wash-types"
                    onclick="tryItOut('POSTapi-v1-wash-types');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-POSTapi-v1-wash-types"
                    onclick="cancelTryOut('POSTapi-v1-wash-types');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-POSTapi-v1-wash-types"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-black">POST</small>
            <b><code>api/v1/wash-types</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="POSTapi-v1-wash-types"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="POSTapi-v1-wash-types"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="POSTapi-v1-wash-types"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.name"                data-endpoint="POSTapi-v1-wash-types"
               value="Tough stains"
               data-component="body">
    <br>
<p>Unique name. Must not be greater than 100 characters. Example: <code>Tough stains</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>description</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.description"                data-endpoint="POSTapi-v1-wash-types"
               value="Heavy-duty treatment for stubborn stains."
               data-component="body">
    <br>
<p>Short note for staff. Must not be greater than 255 characters. Example: <code>Heavy-duty treatment for stubborn stains.</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>surchargePerKgCents</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.surchargePerKgCents"                data-endpoint="POSTapi-v1-wash-types"
               value="500"
               data-component="body">
    <br>
<p>Extra charge per kilo of per-kg laundry, in centavos (0 = none). Must be at least 0. Must not be greater than 1000000. Example: <code>500</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>sortOrder</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.sortOrder"                data-endpoint="POSTapi-v1-wash-types"
               value="5"
               data-component="body">
    <br>
<p>Position in the list. Must be at least 0. Must not be greater than 65535. Example: <code>5</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>isActive</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="POSTapi-v1-wash-types" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="true"
                   data-endpoint="POSTapi-v1-wash-types"
                   data-component="body"             >
            <code>true</code>
        </label>
        <label data-endpoint="POSTapi-v1-wash-types" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="false"
                   data-endpoint="POSTapi-v1-wash-types"
                   data-component="body"             >
            <code>false</code>
        </label>
    <br>
<p>Inactive wash types stay on old orders but cannot be chosen. Example: <code>true</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>supplies</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.supplies"                data-endpoint="POSTapi-v1-wash-types"
               value=""
               data-component="body">
    <br>
<p>Replaces the soaps used: inventoryItemId and usagePerKgSmallUnit (g, mL or pieces per kilo). Must not have more than 20 items.</p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="wash-types-GETapi-v1-wash-types--washType_id-">Show a wash type</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-GETapi-v1-wash-types--washType_id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request GET \
    --get "http://localhost:8000/api/v1/wash-types/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json"</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/wash-types/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};


fetch(url, {
    method: "GET",
    headers,
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-GETapi-v1-wash-types--washType_id-">
            <blockquote>
            <p>Example response (401):</p>
        </blockquote>
                <details class="annotation">
            <summary style="cursor: pointer;">
                <small onclick="textContent = parentElement.parentElement.open ? 'Show headers' : 'Hide headers'">Show headers</small>
            </summary>
            <pre><code class="language-http">cache-control: no-cache, private
content-type: application/json
access-control-allow-origin: http://localhost:5173
access-control-expose-headers: Retry-After
 </code></pre></details>         <pre>

<code class="language-json" style="max-height: 300px;">{
    &quot;errors&quot;: [
        {
            &quot;status&quot;: 401,
            &quot;message&quot;: &quot;Unauthenticated&quot;,
            &quot;source&quot;: &quot;&quot;
        }
    ]
}</code>
 </pre>
    </span>
<span id="execution-results-GETapi-v1-wash-types--washType_id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-GETapi-v1-wash-types--washType_id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-GETapi-v1-wash-types--washType_id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-GETapi-v1-wash-types--washType_id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-GETapi-v1-wash-types--washType_id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-GETapi-v1-wash-types--washType_id-" data-method="GET"
      data-path="api/v1/wash-types/{washType_id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('GETapi-v1-wash-types--washType_id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-GETapi-v1-wash-types--washType_id-"
                    onclick="tryItOut('GETapi-v1-wash-types--washType_id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-GETapi-v1-wash-types--washType_id-"
                    onclick="cancelTryOut('GETapi-v1-wash-types--washType_id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-GETapi-v1-wash-types--washType_id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-green">GET</small>
            <b><code>api/v1/wash-types/{washType_id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="GETapi-v1-wash-types--washType_id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="GETapi-v1-wash-types--washType_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="GETapi-v1-wash-types--washType_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>washType_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="washType_id"                data-endpoint="GETapi-v1-wash-types--washType_id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the washType. Example: <code>1</code></p>
            </div>
                    </form>

                    <h2 id="wash-types-PUTapi-v1-wash-types--washType_id-">Replace a wash type (fields sent; `supplies` replaces the whole list)</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PUTapi-v1-wash-types--washType_id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PUT \
    "http://localhost:8000/api/v1/wash-types/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"name\": \"Tough stains\",
            \"description\": \"Heavy-duty treatment for stubborn stains.\",
            \"surchargePerKgCents\": 500,
            \"sortOrder\": 5,
            \"isActive\": true,
            \"supplies\": [
                {
                    \"inventoryItemId\": 6,
                    \"usagePerKgSmallUnit\": 0.25
                }
            ]
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/wash-types/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "name": "Tough stains",
            "description": "Heavy-duty treatment for stubborn stains.",
            "surchargePerKgCents": 500,
            "sortOrder": 5,
            "isActive": true,
            "supplies": [
                {
                    "inventoryItemId": 6,
                    "usagePerKgSmallUnit": 0.25
                }
            ]
        }
    }
};

fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PUTapi-v1-wash-types--washType_id-">
</span>
<span id="execution-results-PUTapi-v1-wash-types--washType_id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PUTapi-v1-wash-types--washType_id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PUTapi-v1-wash-types--washType_id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PUTapi-v1-wash-types--washType_id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PUTapi-v1-wash-types--washType_id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PUTapi-v1-wash-types--washType_id-" data-method="PUT"
      data-path="api/v1/wash-types/{washType_id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PUTapi-v1-wash-types--washType_id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PUTapi-v1-wash-types--washType_id-"
                    onclick="tryItOut('PUTapi-v1-wash-types--washType_id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PUTapi-v1-wash-types--washType_id-"
                    onclick="cancelTryOut('PUTapi-v1-wash-types--washType_id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PUTapi-v1-wash-types--washType_id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-darkblue">PUT</small>
            <b><code>api/v1/wash-types/{washType_id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PUTapi-v1-wash-types--washType_id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PUTapi-v1-wash-types--washType_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PUTapi-v1-wash-types--washType_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>washType_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="washType_id"                data-endpoint="PUTapi-v1-wash-types--washType_id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the washType. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.name"                data-endpoint="PUTapi-v1-wash-types--washType_id-"
               value="Tough stains"
               data-component="body">
    <br>
<p>Unique name. Must not be greater than 100 characters. Example: <code>Tough stains</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>description</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.description"                data-endpoint="PUTapi-v1-wash-types--washType_id-"
               value="Heavy-duty treatment for stubborn stains."
               data-component="body">
    <br>
<p>Short note for staff. Must not be greater than 255 characters. Example: <code>Heavy-duty treatment for stubborn stains.</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>surchargePerKgCents</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.surchargePerKgCents"                data-endpoint="PUTapi-v1-wash-types--washType_id-"
               value="500"
               data-component="body">
    <br>
<p>Extra charge per kilo of per-kg laundry, in centavos (0 = none). Must be at least 0. Must not be greater than 1000000. Example: <code>500</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>sortOrder</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.sortOrder"                data-endpoint="PUTapi-v1-wash-types--washType_id-"
               value="5"
               data-component="body">
    <br>
<p>Position in the list. Must be at least 0. Must not be greater than 65535. Example: <code>5</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>isActive</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="PUTapi-v1-wash-types--washType_id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="true"
                   data-endpoint="PUTapi-v1-wash-types--washType_id-"
                   data-component="body"             >
            <code>true</code>
        </label>
        <label data-endpoint="PUTapi-v1-wash-types--washType_id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="false"
                   data-endpoint="PUTapi-v1-wash-types--washType_id-"
                   data-component="body"             >
            <code>false</code>
        </label>
    <br>
<p>Inactive wash types stay on old orders but cannot be chosen. Example: <code>true</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>supplies</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.supplies"                data-endpoint="PUTapi-v1-wash-types--washType_id-"
               value=""
               data-component="body">
    <br>
<p>Replaces the soaps used: inventoryItemId and usagePerKgSmallUnit (g, mL or pieces per kilo). Must not have more than 20 items.</p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

                    <h2 id="wash-types-PATCHapi-v1-wash-types--washType_id-">Update a wash type (fields sent)</h2>

<p>
<small class="badge badge-darkred">requires authentication</small>
</p>



<span id="example-requests-PATCHapi-v1-wash-types--washType_id-">
<blockquote>Example request:</blockquote>


<div class="bash-example">
    <pre><code class="language-bash">curl --request PATCH \
    "http://localhost:8000/api/v1/wash-types/1" \
    --header "Authorization: Bearer {YOUR_AUTH_KEY}" \
    --header "Content-Type: application/json" \
    --header "Accept: application/json" \
    --data "{
    \"data\": {
        \"attributes\": {
            \"name\": \"Tough stains\",
            \"description\": \"Heavy-duty treatment for stubborn stains.\",
            \"surchargePerKgCents\": 500,
            \"sortOrder\": 5,
            \"isActive\": true,
            \"supplies\": [
                {
                    \"inventoryItemId\": 6,
                    \"usagePerKgSmallUnit\": 0.25
                }
            ]
        }
    }
}"
</code></pre></div>


<div class="javascript-example">
    <pre><code class="language-javascript">const url = new URL(
    "http://localhost:8000/api/v1/wash-types/1"
);

const headers = {
    "Authorization": "Bearer {YOUR_AUTH_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
};

let body = {
    "data": {
        "attributes": {
            "name": "Tough stains",
            "description": "Heavy-duty treatment for stubborn stains.",
            "surchargePerKgCents": 500,
            "sortOrder": 5,
            "isActive": true,
            "supplies": [
                {
                    "inventoryItemId": 6,
                    "usagePerKgSmallUnit": 0.25
                }
            ]
        }
    }
};

fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
}).then(response =&gt; response.json());</code></pre></div>

</span>

<span id="example-responses-PATCHapi-v1-wash-types--washType_id-">
</span>
<span id="execution-results-PATCHapi-v1-wash-types--washType_id-" hidden>
    <blockquote>Received response<span
                id="execution-response-status-PATCHapi-v1-wash-types--washType_id-"></span>:
    </blockquote>
    <pre class="json"><code id="execution-response-content-PATCHapi-v1-wash-types--washType_id-"
      data-empty-response-text="<Empty response>" style="max-height: 400px;"></code></pre>
</span>
<span id="execution-error-PATCHapi-v1-wash-types--washType_id-" hidden>
    <blockquote>Request failed with error:</blockquote>
    <pre><code id="execution-error-message-PATCHapi-v1-wash-types--washType_id-">

Tip: Check that you&#039;re properly connected to the network.
If you&#039;re a maintainer of ths API, verify that your API is running and you&#039;ve enabled CORS.
You can check the Dev Tools console for debugging information.</code></pre>
</span>
<form id="form-PATCHapi-v1-wash-types--washType_id-" data-method="PATCH"
      data-path="api/v1/wash-types/{washType_id}"
      data-authed="1"
      data-hasfiles="0"
      data-isarraybody="0"
      autocomplete="off"
      onsubmit="event.preventDefault(); executeTryOut('PATCHapi-v1-wash-types--washType_id-', this);">
    <h3>
        Request&nbsp;&nbsp;&nbsp;
                    <button type="button"
                    style="background-color: #8fbcd4; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-tryout-PATCHapi-v1-wash-types--washType_id-"
                    onclick="tryItOut('PATCHapi-v1-wash-types--washType_id-');">Try it out ⚡
            </button>
            <button type="button"
                    style="background-color: #c97a7e; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-canceltryout-PATCHapi-v1-wash-types--washType_id-"
                    onclick="cancelTryOut('PATCHapi-v1-wash-types--washType_id-');" hidden>Cancel 🛑
            </button>&nbsp;&nbsp;
            <button type="submit"
                    style="background-color: #6ac174; padding: 5px 10px; border-radius: 5px; border-width: thin;"
                    id="btn-executetryout-PATCHapi-v1-wash-types--washType_id-"
                    data-initial-text="Send Request 💥"
                    data-loading-text="⏱ Sending..."
                    hidden>Send Request 💥
            </button>
            </h3>
            <p>
            <small class="badge badge-purple">PATCH</small>
            <b><code>api/v1/wash-types/{washType_id}</code></b>
        </p>
                <h4 class="fancy-heading-panel"><b>Headers</b></h4>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Authorization</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Authorization" class="auth-value"               data-endpoint="PATCHapi-v1-wash-types--washType_id-"
               value="Bearer {YOUR_AUTH_KEY}"
               data-component="header">
    <br>
<p>Example: <code>Bearer {YOUR_AUTH_KEY}</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Content-Type</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Content-Type"                data-endpoint="PATCHapi-v1-wash-types--washType_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                                <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>Accept</code></b>&nbsp;&nbsp;
&nbsp;
 &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="Accept"                data-endpoint="PATCHapi-v1-wash-types--washType_id-"
               value="application/json"
               data-component="header">
    <br>
<p>Example: <code>application/json</code></p>
            </div>
                        <h4 class="fancy-heading-panel"><b>URL Parameters</b></h4>
                    <div style="padding-left: 28px; clear: unset;">
                <b style="line-height: 2;"><code>washType_id</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
 &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="washType_id"                data-endpoint="PATCHapi-v1-wash-types--washType_id-"
               value="1"
               data-component="url">
    <br>
<p>The ID of the washType. Example: <code>1</code></p>
            </div>
                            <h4 class="fancy-heading-panel"><b>Body Parameters</b></h4>
        <div style=" padding-left: 28px;  clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>data</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style=" margin-left: 14px; clear: unset;">
        <details>
            <summary style="padding-bottom: 10px;">
                <b style="line-height: 2;"><code>attributes</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
 &nbsp;
 &nbsp;
<br>

            </summary>
                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>name</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.name"                data-endpoint="PATCHapi-v1-wash-types--washType_id-"
               value="Tough stains"
               data-component="body">
    <br>
<p>Unique name. Must not be greater than 100 characters. Example: <code>Tough stains</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>description</code></b>&nbsp;&nbsp;
<small>string</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.description"                data-endpoint="PATCHapi-v1-wash-types--washType_id-"
               value="Heavy-duty treatment for stubborn stains."
               data-component="body">
    <br>
<p>Short note for staff. Must not be greater than 255 characters. Example: <code>Heavy-duty treatment for stubborn stains.</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>surchargePerKgCents</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.surchargePerKgCents"                data-endpoint="PATCHapi-v1-wash-types--washType_id-"
               value="500"
               data-component="body">
    <br>
<p>Extra charge per kilo of per-kg laundry, in centavos (0 = none). Must be at least 0. Must not be greater than 1000000. Example: <code>500</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>sortOrder</code></b>&nbsp;&nbsp;
<small>integer</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="number" style="display: none"
               step="any"               name="data.attributes.sortOrder"                data-endpoint="PATCHapi-v1-wash-types--washType_id-"
               value="5"
               data-component="body">
    <br>
<p>Position in the list. Must be at least 0. Must not be greater than 65535. Example: <code>5</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>isActive</code></b>&nbsp;&nbsp;
<small>boolean</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <label data-endpoint="PATCHapi-v1-wash-types--washType_id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="true"
                   data-endpoint="PATCHapi-v1-wash-types--washType_id-"
                   data-component="body"             >
            <code>true</code>
        </label>
        <label data-endpoint="PATCHapi-v1-wash-types--washType_id-" style="display: none">
            <input type="radio" name="data.attributes.isActive"
                   value="false"
                   data-endpoint="PATCHapi-v1-wash-types--washType_id-"
                   data-component="body"             >
            <code>false</code>
        </label>
    <br>
<p>Inactive wash types stay on old orders but cannot be chosen. Example: <code>true</code></p>
                    </div>
                                                                <div style="margin-left: 28px; clear: unset;">
                        <b style="line-height: 2;"><code>supplies</code></b>&nbsp;&nbsp;
<small>object</small>&nbsp;
<i>optional</i> &nbsp;
 &nbsp;
                <input type="text" style="display: none"
                              name="data.attributes.supplies"                data-endpoint="PATCHapi-v1-wash-types--washType_id-"
               value=""
               data-component="body">
    <br>
<p>Replaces the soaps used: inventoryItemId and usagePerKgSmallUnit (g, mL or pieces per kilo). Must not have more than 20 items.</p>
                    </div>
                                    </details>
        </div>
                                        </details>
        </div>
        </form>

            

        
    </div>
    <div class="dark-box">
                    <div class="lang-selector">
                                                        <button type="button" class="lang-button" data-language-name="bash">bash</button>
                                                        <button type="button" class="lang-button" data-language-name="javascript">javascript</button>
                            </div>
            </div>
</div>
</body>
</html>
