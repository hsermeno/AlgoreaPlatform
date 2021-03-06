<?php

error_reporting(E_ALL);
ini_set('display_errors', '1');

// json request parsing
$postdata = file_get_contents("php://input");
$request = (array) json_decode($postdata);

require_once("../shared/connect.php");

if (session_status() === PHP_SESSION_NONE){session_start();}
header('Content-Type: application/json');

if (!isset($request['action'])) {
   echo json_encode(array('result' => false, 'error' => 'missing action'));
   exit();
}
if (!isset($_SESSION['login']) || $_SESSION['login']['tempUser']) {
   echo json_encode(array('result' => false, 'error' => 'only identified users can use this file'));
   exit();
}

function getGroupsFromLogins($request, $db, $admin=false) {
   if (!$request['logins'] || empty($request['logins'] || !$request['idGroup'])) {
      echo json_encode(array('result' => false, 'error' => 'missing arguments in request'));
      return;
   }
   $logins = $request['logins'];
   $condition = '';
   $values = array();
   foreach($request['logins'] as $idx => $login) {
      $login = trim($login);
      if ($login == '') continue;
      $condition .= ($idx == 0 ? '' : ' or ').'users.sLogin = :sLogin'.$idx;
      $values['sLogin'.$idx] = $login;
   }
   if ($condition == '') {
      echo json_encode(array('result' => false, 'error' => 'missing arguments in request'));
      return;
   }
   if ($admin) {
      $query = 'select sLogin, idGroupOwned as idGroup from users where '.$condition.';';
   } else {
      $query = 'select sLogin, idGroupSelf as idGroup from users where '.$condition.';';
   }
   $stmt = $db->prepare($query);
   $stmt->execute($values);
   $results = $stmt->fetchAll();
   $returnedObject = array('success' => true, 'loginsNotFound' => array(), 'logins_groups' => array(), 'request' => $request);
   foreach ($results as $result) {
      $returnedObject['logins_groups'][$result['sLogin']] = $result['idGroup'];
   }
   foreach($request['logins'] as $login) {
      if (!isset($returnedObject['logins_groups'][$login])) {
         $returnedObject['loginsNotFound'][] = $login;
      }
   }
   echo json_encode($returnedObject);
}

if ($request['action'] == 'getGroupsFromLogins') {
   getGroupsFromLogins($request, $db);
} elseif ($request['action'] == 'getAdminGroupsFromLogins') {
   getGroupsFromLogins($request, $db, true);
} else {
   echo json_encode(array('result' => false, 'error' => 'unrecognized action'));
}
