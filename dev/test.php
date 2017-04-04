<?php 
$apple =file_get_contents('https://www.bible.com/bible/131/mat.5.1.json');
print_r(json_decode ($apple,true));
// echo json_decode (file_get_contents('https://www.bible.com/bible/131/mat.5.1.json'));
?>