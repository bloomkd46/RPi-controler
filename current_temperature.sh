#!/bin/bash
cpuTemp0=$(cat /sys/class/thermal/thermal_zone0/temp)
cpuTemp1=$(($cpuTemp0/1000))
cpuTemp2=$(($cpuTemp0/100))
cpuTempM=$(($cpuTemp2 % $cpuTemp1))

gpuTemp0=$(/opt/vc/bin/vcgencmd measure_temp)
gpuTemp0=${gpuTemp0}
gpuTemp0=${gpuTemp0//temp=/}

echo $(date "+%Y-%m-%d %H:%M") Temperature CPU : $cpuTemp1"."$cpuTempM"'C, GPU : "$gpuTemp0
