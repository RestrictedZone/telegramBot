# -*- coding: utf-8 -*-

import cv2
import numpy as np

def cv2threshold(path):
    img = cv2.imread(path)
    dst = 'images/filtered.png'
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # enlarge 2x
    height, width = gray.shape
    h_cut = int(height/3)*2
    h_crop = height - h_cut
    gray_roi = gray[h_cut:height,:]
    gray_resize = cv2.resize(gray_roi, (2*width, 2*h_crop), interpolation=cv2.INTER_LINEAR)

    # denoising
    denoised = cv2.fastNlMeansDenoising(gray_resize, h=10, searchWindowSize=21, templateWindowSize=7)

    # image thresholding
    ret, thr = cv2.threshold(gray_resize, 192, 255, cv2.THRESH_BINARY)
    thr[:h_crop*2-200, :width*2] = ~thr[:h_crop*2-200, :width*2]

    # filtered file save & return
    cv2.imwrite(dst, thr)
    print dst

if __name__ == '__main__':
	cv2threshold('images/recent.png')
