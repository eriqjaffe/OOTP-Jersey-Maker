<?php
header('Content-type: image/png');
//header('Content-Disposition: attachment; filename="test.png"');

$deformation = $_POST['deform'];
$amount = $_POST['amount'];
$encoded = $_POST['imgdata'];
$encoded = str_replace(' ', '+', $encoded);
$decoded = base64_decode($encoded);

echo $deformation($decoded,$amount);

// switch($deformation) {
// 	case "arch":
// 		echo arch($decoded,$amount);
// 		break;
// 	case "arc":
// 		echo arc($decoded,$amount);
// 		break;
// 	case "bilinearUp":
// 		echo bilinearUp($decoded,$amount);
// 		break;
// 	case "bilinearDown":
// 		echo bilinearDown($decoded,$amount);
// 		break;
// 	case "test":
// 		echo test($decoded,$amount);
// 		break;
// 	case "pinch":
// 		echo pinch($decoded);
// 		break;
// 	case "sandbox":
// 		echo sandbox($decoded,$amount);
// 		break;
// }

function arch($image,$wavelengh) {
	$im = new Imagick();
	$im->setBackgroundColor(new ImagickPixel('transparent')); 
	$im->readimageblob($image);
	$im->setImageVirtualPixelMethod( imagick::VIRTUALPIXELMETHOD_BACKGROUND );
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	$w = $im->getImageWidth();
	$im->waveImage($wavelengh*-1,$w*2);
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	return(base64_encode($im));
}

function arc($image,$degrees) {
	$x = array($degrees);
	$im = new Imagick();
	$im->setBackgroundColor(new ImagickPixel('transparent'));
	$im->readimageblob($image);
	$im->setImageVirtualPixelMethod( imagick::VIRTUALPIXELMETHOD_BACKGROUND );
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	$im->distortImage( Imagick::DISTORTION_ARC, $x, TRUE ); 
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	return(base64_encode($im));
}

function bilinearUp($image,$amount) {
	$im = new Imagick();
	$im->setBackgroundColor(new ImagickPixel('transparent'));
	$im->readimageblob($image);
	$im->setImageVirtualPixelMethod( imagick::VIRTUALPIXELMETHOD_BACKGROUND );
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	$x1 = $im->getImageWidth();
	$x2 = $im->getImageWidth();
	$y1 = $im->getImageHeight();
	$y2 = $im->getImageHeight()/((100-$amount)*0.01);
	$im->setGravity(imagick::GRAVITY_NORTH);
	$im->extentImage ($x2,$y2,0,0);
	$points = array(
		0, 0, 0, 0, #top left
		0, $y1, 0, $y2, #bottom left
		$x1, 0, $x1, 0, #top right
		$x1, $y1, $x1, $y1 #bottom right
	);
	$im->distortImage( Imagick::DISTORTION_BILINEAR, $points, TRUE );
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	return(base64_encode($im));	
}

function bilinearDown($image,$amount) {
	$im = new Imagick();
	$im->setBackgroundColor(new ImagickPixel('transparent'));
	$im->readimageblob($image);
	$im->setImageVirtualPixelMethod( imagick::VIRTUALPIXELMETHOD_BACKGROUND );
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	$x1 = $im->getImageWidth();
	$x2 = $im->getImageWidth();
	$y1 = $im->getImageHeight();
	$y2 = $im->getImageHeight()/((100-$amount)*0.01);
	$im->setGravity(imagick::GRAVITY_NORTH);
	$im->extentImage ($x2,$y2,0,0);
	$points = array(
		0, 0, 0, 0, #top left
		0, $y1, 0, $y1, #bottom left
		$x1, 0, $x1, 0, #top right
		$x1, $y1, $x1, $y2 #bottom right
	);
	$im->distortImage( Imagick::DISTORTION_BILINEAR, $points, TRUE );
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	return(base64_encode($im));
}

function test($image,$amount) {
	$im = new Imagick();
	$im->setBackgroundColor(new ImagickPixel('transparent'));
	$im->readimageblob($image);
	$im->setImageVirtualPixelMethod( imagick::VIRTUALPIXELMETHOD_BACKGROUND );
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	$im->setGravity(imagick::GRAVITY_CENTER);
	$im->extentImage (512,512,0,0);
	$points = array(0.0, 0.0, 0.0, 1.0,   0.0, 0.0, -0.1, 1.1);
	$im->distortImage( Imagick::DISTORTION_BARREL, $points, TRUE );
	$im->trimImage(0);
	//$im->setImagePage(0, 0, 0, 0);
	return($im->getImageHeight().' '.$im->getImageWidth());
}

function pinch($image) {
	/* $im = new Imagick();
	$im->setBackgroundColor(new ImagickPixel('transparent'));
	$im->readimageblob($image);
	$im->setImageVirtualPixelMethod( imagick::VIRTUALPIXELMETHOD_BACKGROUND );
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	//$im->setGravity(imagick::GRAVITY_CENTER);
	//$im->extentImage (512,512,0,0);
	$points = array(0,0, 0.5, 0.0, 5.0);
	$im->distortImage( Imagick::DISTORTION_BARREL, $points, TRUE );
	$im->trimImage(0); */
	$im = new Imagick();
	$im->setBackgroundColor(new ImagickPixel('transparent'));
	$im->readimageblob($image);
	$im->trimImage(0);
	//$im->setGravity(imagick::GRAVITY_NORTH);
	$im->extentImage ($im->getImageWidth(),($im->getImageHeight()*2),0,0);
	$im->setImagePage(0, 0, 0, 0);
	$distort = array( 0.0, -.05, .05, 1  );
	$im->setImageVirtualPixelMethod( Imagick::VIRTUALPIXELMETHOD_TRANSPARENT );
	$im->setImageMatte( TRUE );
	$im->distortImage( Imagick::DISTORTION_BARREL, $distort, TRUE );  
	return(base64_encode($im));
}

function archUp($image,$amount) {
	$im = new Imagick();
	$im->setBackgroundColor(new ImagickPixel('transparent'));
	$im->readimageblob($image);
	$im->setImageVirtualPixelMethod( imagick::VIRTUALPIXELMETHOD_BACKGROUND );
	$im->trimImage(0);
	$imOut = new Imagick();
	$imOut->setBackgroundColor(new ImagickPixel('transparent')); 
	$imOut->newImage($im->getImageWidth()*2, $im->getImageHeight(), new ImagickPixel('transparent'));
	$imOut->setImageVirtualPixelMethod( Imagick::VIRTUALPIXELMETHOD_TRANSPARENT );	
	$imOut->setImageFormat('png');
	$imOut->compositeimage($im, Imagick::COMPOSITE_DEFAULT, 0, 0);
	$imOut->compositeimage($im, Imagick::COMPOSITE_DEFAULT, $im->getImageWidth()+1, 0);
	$imOut->waveImage($amount*-2,$imOut->getImageWidth()*2);
	$imOut->cropImage($imOut->getImageWidth()/2,$imOut->getImageHeight(),0,0);
	$imOut->trimImage(0);
	$imOut->setImagePage(0, 0, 0, 0);
	return(base64_encode($imOut));
}

function archDown($image,$amount) {
	$im = new Imagick();
	$im->setBackgroundColor(new ImagickPixel('transparent'));
	$im->readimageblob($image);
	$im->setImageVirtualPixelMethod( imagick::VIRTUALPIXELMETHOD_BACKGROUND );
	$im->trimImage(0);
	$imOut = new Imagick();
	$imOut->setBackgroundColor(new ImagickPixel('transparent')); 
	$imOut->newImage($im->getImageWidth()*2, $im->getImageHeight(), new ImagickPixel('transparent'));
	$imOut->setImageVirtualPixelMethod( Imagick::VIRTUALPIXELMETHOD_TRANSPARENT );	
	$imOut->setImageFormat('png');
	$imOut->compositeimage($im, Imagick::COMPOSITE_DEFAULT, 0, 0);
	$imOut->compositeimage($im, Imagick::COMPOSITE_DEFAULT, $im->getImageWidth()+1, 0);
	$imOut->waveImage($amount*-2,$imOut->getImageWidth()*2);
	$imOut->cropImage($imOut->getImageWidth()/2,$imOut->getImageHeight(),$im->getImageWidth()+1,0);
	$imOut->trimImage(0);
	$imOut->setImagePage(0, 0, 0, 0);
	return(base64_encode($imOut));
}

function skewUp($image,$amount) {
	$im = new Imagick();
	$im->setBackgroundColor(new ImagickPixel('transparent'));
	$im->readimageblob($image);
	$im->setImageVirtualPixelMethod( imagick::VIRTUALPIXELMETHOD_BACKGROUND );
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	$x1 = $im->getImageWidth();
	$x2 = $im->getImageWidth();
	$y1 = $im->getImageHeight();
	$y2 = $im->getImageHeight()/((100-$amount)*0.01);
	$im->setGravity(imagick::GRAVITY_NORTH);
	$im->extentImage ($x2,$y2,0,0);
	$points = array(
		0, 0, 0, $im->getImageHeight()-$y1, #top left
		0, $y1, 0, $y2, #bottom left
		$x1, 0, $x1, 0, #top right
		$x1, $y1, $x1, $y1 #bottom right
	);
	$im->distortImage( Imagick::DISTORTION_BILINEAR, $points, TRUE );
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	return(base64_encode($im));	
}

function skewDown($image,$amount) {
	$im = new Imagick();
	$im->setBackgroundColor(new ImagickPixel('transparent'));
	$im->readimageblob($image);
	$im->setImageVirtualPixelMethod( imagick::VIRTUALPIXELMETHOD_BACKGROUND );
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	$x1 = $im->getImageWidth();
	$x2 = $im->getImageWidth();
	$y1 = $im->getImageHeight();
	$y2 = $im->getImageHeight()/((100-$amount)*0.01);
	$im->setGravity(imagick::GRAVITY_NORTH);
	$im->extentImage ($x2,$y2,0,0);
	$points = array(
		0, 0, 0, 0, #top left
		0, $y1, 0, $y1, #bottom left
		$x1, 0, $x1, $im->getImageHeight()-$y1, #top right
		$x1, $y1, $x1, $y2 #bottom right
	);
	$im->distortImage( Imagick::DISTORTION_BILINEAR, $points, TRUE );
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	return(base64_encode($im));	
}

function sandbox($image,$amount) {
	$im = new Imagick();
	$im->setBackgroundColor(new ImagickPixel('transparent'));
	$im->readimageblob($image);
	$im->setImageVirtualPixelMethod( imagick::VIRTUALPIXELMETHOD_BACKGROUND );
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	$x1 = $im->getImageWidth();
	$x2 = $im->getImageWidth();
	$y1 = $im->getImageHeight();
	$y2 = $im->getImageHeight()/((100-$amount)*0.01);
	$im->setGravity(imagick::GRAVITY_NORTH);
	$im->extentImage ($x2,$y2,0,0);
	$points = array(
		0, 0, 0, $im->getImageHeight()-$y1, #top left
		0, $y1, 0, $y2, #bottom left
		$x1, 0, $x1, 0, #top right
		$x1, $y1, $x1, $y1 #bottom right
	);
	$im->distortImage( Imagick::DISTORTION_BILINEAR, $points, TRUE );
	$im->trimImage(0);
	$im->setImagePage(0, 0, 0, 0);
	return(base64_encode($im));
}

/* function sandbox($image,$amount) {
	$im = new Imagick();
	$im->readimageblob($image);
	$im->trimImage(0);
	$w = $im->getImageWidth();
	$h = $im->getImageHeight();

	//Create a ImagickDraw object to draw into.
    $draw = new ImagickDraw();
    $draw->setStrokeWidth(0);
    $draw->setStrokeColor("black");
	$draw->setStrokeOpacity (0);
    $draw->setStrokeAntiAlias (true);
    $draw->setFillColor("white");
    $draw->setStrokeWidth(2);

    //$draw->arc(0, $h, $w, $h, 0, 360);
	$points = array
    (
        array( 'x' => 0, 'y' => $h ),
        //array( 'x' => $w/2, 'y' => $h-$amount ),
        array( 'x' => $w/2, 'y' => 0 ),
        array( 'x' => $w, 'y' => $h )
    );
	$draw->bezier($points);

    //Create an image object which the draw commands can be rendered into
    $image = new Imagick();
    //$image->newImage($w, $h, "none");
	$image->newImage($w, $h, "black");
    $image->setImageFormat("png");

    //Render the draw commands in the ImagickDraw object 
    //into the image.
    $image->drawImage($draw);
	
	$im->mapImage($image,true);
	
	//$imOut = new Imagick();
	$im->setOption('compose:args', $w.'x'.$h);
	$im->compositeImage($image, Imagick::COMPOSITE_DSTIN, 0, 0, Imagick::CHANNEL_ALPHA);

	return(base64_encode($im));
} */