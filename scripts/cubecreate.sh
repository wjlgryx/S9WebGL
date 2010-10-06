#! /bin/sh
convert $1 test.ppm

project gnomonic -scale 2 -lat 0 -long  90 -w $2 -h $2 -f test.ppm > real_00.ppm
project gnomonic -scale 2 -lat 0 -long 270 -w $2 -h $2 -f test.ppm > real_01.ppm
project gnomonic -scale 2 -lat  90 -long 0 -w $2 -h $2 -f test.ppm > real_02.ppm
project gnomonic -scale 2 -lat -90 -long 0 -w $2 -h $2 -f test.ppm > real_03.ppm
project gnomonic -scale 2 -lat 0 -long   0 -w $2 -h $2 -f test.ppm > real_04.ppm
project gnomonic -scale 2 -lat 0 -long 180 -w $2 -h $2 -f test.ppm > real_05.ppm

#project gnomonic -scale 2 -lat 0 -long  90 -w 2048 -h 2048 -grid -gridcolor 255:0:0 -f test.ppm > real_03.ppm
#project gnomonic -scale 2 -lat 0 -long 270 -w 2048 -h 2048 -grid -gridcolor 255:0:0 -f test.ppm > real_02.ppm
#project gnomonic -scale 2 -lat  90 -long 0 -w 2048 -h 2048 -grid -gridcolor 255:0:0 -f test.ppm > real_04.ppm
#project gnomonic -scale 2 -lat -90 -long 0 -w 2048 -h 2048 -grid -gridcolor 255:0:0 -f test.ppm > real_05.ppm
#project gnomonic -scale 2 -lat 0 -long   0 -w 2048 -h 2048 -grid -gridcolor 255:0:0 -f test.ppm > real_00.ppm
#project gnomonic -scale 2 -lat 0 -long 180 -w 2048 -h 2048 -grid -gridcolor 255:0:0 -f test.ppm > real_01.ppm

#mogrify -rotate 180  -format bmp real_00.ppm
#mogrify -format bmp real_01.ppm
#mogrify -rotate 90 -format bmp real_02.ppm
#mogrify -rotate -90 -format bmp real_03.ppm
#mogrify -format bmp real_04.ppm
#mogrify -rotate 180 -format bmp real_05.ppm

mogrify -rotate 180 real_00.ppm
mogrify -rotate 180 real_01.ppm
mogrify -rotate 180 real_02.ppm
mogrify -rotate 180 real_03.ppm
mogrify -rotate 180 real_04.ppm
mogrify -rotate 180 real_05.ppm

mogrify -flop real_00.ppm
mogrify -flop real_01.ppm
mogrify -flop real_02.ppm
mogrify -flop real_03.ppm
mogrify -flop real_04.ppm
mogrify -flop real_05.ppm

convert real_00.ppm cube_00.gif
convert real_01.ppm cube_01.gif
convert real_02.ppm cube_02.gif
convert real_03.ppm cube_03.gif
convert real_04.ppm cube_04.gif
convert real_05.ppm cube_05.gif

rm -rf *.ppm
rm -rf *.bmp
