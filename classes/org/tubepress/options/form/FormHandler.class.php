<?php
/**
 * Copyright 2006 - 2010 Eric D. Hough (http://ehough.com)
 * 
 * This file is part of TubePress (http://tubepress.org)
 * 
 * TubePress is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * TubePress is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with TubePress.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

function_exists('tubepress_load_classes')
    || require(dirname(__FILE__) . '/../../../../tubepress_classloader.php');
tubepress_load_classes(array('org_tubepress_options_Category',
    'org_tubepress_options_Type',
    'org_tubepress_api_message_MessageService',
    'org_tubepress_options_reference_OptionsReference',
    'org_tubepress_options_storage_StorageManager',
    'org_tubepress_api_ioc_IocService',
    'org_tubepress_template_SimpleTemplate',
    'org_tubepress_api_template_Template',
    'org_tubepress_options_category_Gallery',
    'org_tubepress_util_FilesystemUtils'));

/**
 * Displays a generic options form for TubePress
 *
 */
class org_tubepress_options_form_FormHandler
{
    /**
     * Displays all the TubePress options in HTML
     *
     * @param org_tubepress_options_storage_StorageManager $tpsm The TubePress storage manager
     * 
     * @return void
     */
    public final function getHtml()
    {   
        global $tubepress_base_url;

	    $ioc            = org_tubepress_ioc_IocContainer::getInstance();
        $messageService = $ioc->get('org_tubepress_api_message_MessageService');
        $template       = new org_tubepress_template_SimpleTemplate();
        $storageManager = $ioc->get('org_tubepress_options_storage_StorageManager');

        $template->setPath(dirname(__FILE__) . '/../../../../../ui/lib/options_page/html_templates/options_page.tpl.php');
        
        /* set the surrounding text */
        $template->setVariable(org_tubepress_api_template_Template::OPTIONS_PAGE_TITLE, $messageService->_('options-page-title'));
        $template->setVariable(org_tubepress_api_template_Template::OPTIONS_PAGE_INTRO, $messageService->_('options-page-intro-text'));
        $template->setVariable(org_tubepress_api_template_Template::OPTIONS_PAGE_DONATION, $messageService->_('options-page-donation'));
        $template->setVariable(org_tubepress_api_template_Template::OPTIONS_PAGE_SAVE, $messageService->_('options-page-save-button'));
        $template->setVariable(org_tubepress_api_template_Template::TUBEPRESS_BASE_URL, $tubepress_base_url);

        $categories = array();
        
        /* now parse each option category */
        $optionCategoryNames = org_tubepress_options_reference_OptionsReference::getOptionCategoryNames();
        foreach ($optionCategoryNames as $optionCategoryName) {

            /* don't display the widget options on this page */
            if (!org_tubepress_options_reference_OptionsReference::isOptionCategoryApplicableToOptionsForm($optionCategoryName)) {
                continue;
            }
            $categories[$optionCategoryName] = $this->_createCategoryMetaArray($optionCategoryName, $messageService, $storageManager);
        }
        $template->setVariable(org_tubepress_api_template_Template::OPTIONS_PAGE_CATEGORIES, $categories);
        return $template->toString();
    }
    
    /**
     * Updates options from a keyed array
     *
     * @param org_tubepress_options_storage_StorageManager $tpsm     The TubePress storage manager
     * @param array                                        $postVars The POST variables
     * 
     * @return void
     */
    public final function collect($postVars)
    {   
	$ioc            = org_tubepress_ioc_IocContainer::getInstance();
        $storageManager = $ioc->get('org_tubepress_options_storage_StorageManager');
        
        /* this loop will collect everything except checkboxes */
        foreach ($postVars as $name => $value) {
            if (org_tubepress_options_reference_OptionsReference::getType($name) === org_tubepress_options_Type::BOOL) {
                continue;
            }

            if ($storageManager->exists($name)) {
                $storageManager->set($name, $value);
            }
        }

        /* this loop will handle the checkboxes */
        $names = org_tubepress_options_reference_OptionsReference::getAllOptionNames();
        foreach ($names as $name) {

            /* ignore non-bools */
            if (org_tubepress_options_reference_OptionsReference::getType($name) != org_tubepress_options_Type::BOOL) {
                continue;
            }

            /* if the user checked the box, the option name will appear in the POST vars */
            $storageManager->set($name, array_key_exists($name, $postVars));         
        }
    }
    
    private function _createCategoryMetaArray($optionCategoryName, org_tubepress_api_message_MessageService $messageService, org_tubepress_options_storage_StorageManager $storageManager)
    {
        $results = array();
        $results[org_tubepress_api_template_Template::OPTIONS_PAGE_CATEGORY_TITLE] = $messageService->_("options-category-title-$optionCategoryName");
        $results[org_tubepress_api_template_Template::OPTIONS_PAGE_CATEGORY_OPTIONS] = $optionCategoryName == org_tubepress_options_Category::GALLERY ?
            $this->_createCategoryMetaArrayForGalleryOptions($storageManager, $messageService) : $this->_createCategoryOptionsMetaArray($optionCategoryName, $messageService, $storageManager);
        return $results;
    }
    
    private function _createCategoryOptionsMetaArray($optionCategoryName, org_tubepress_api_message_MessageService $messageService, 
        org_tubepress_options_storage_StorageManager $storageManager)
    {
        $optionNames = org_tubepress_options_reference_OptionsReference::getOptionNamesForCategory($optionCategoryName);
        $optionsMetaArray = array();
        global $tubepress_base_url;
        
        foreach ($optionNames as $optionName) {
            
            if (!org_tubepress_options_reference_OptionsReference::isOptionApplicableToOptionsForm($optionName)) {
                continue;
            }
            
            $metaArray = array();
            $metaArray[org_tubepress_api_template_Template::OPTIONS_PAGE_OPTIONS_TITLE]    = $messageService->_("options-title-$optionName");
            $metaArray[org_tubepress_api_template_Template::OPTIONS_PAGE_OPTIONS_PRO_ONLY] = org_tubepress_options_reference_OptionsReference::isOptionProOnly($optionName) ? '*' : '';
            $metaArray[org_tubepress_api_template_Template::OPTIONS_PAGE_OPTIONS_WIDGET]   = $this->_getWidgetHtml($optionName, $storageManager, $messageService);
            $metaArray[org_tubepress_api_template_Template::OPTIONS_PAGE_YOUTUBE_OPTION]   = org_tubepress_options_reference_OptionsReference::appliesToYouTube($optionName);
            $metaArray[org_tubepress_api_template_Template::OPTIONS_PAGE_VIMEO_OPTION]     = org_tubepress_options_reference_OptionsReference::appliesToVimeo($optionName);

            if ($optionName == org_tubepress_options_category_Display::THEME) {
                $baseInstallationPath = org_tubepress_util_FilesystemUtils::getTubePressBaseInstallationPath();
                $metaArray[org_tubepress_api_template_Template::OPTIONS_PAGE_OPTIONS_DESC] = sprintf($messageService->_("options-desc-$optionName"),
                     "$baseInstallationPath/content/themes", "$baseInstallationPath/ui/themes");
            } else {
                $metaArray[org_tubepress_api_template_Template::OPTIONS_PAGE_OPTIONS_DESC] = $messageService->_("options-desc-$optionName");
            }
            
            $optionsMetaArray[] = $metaArray;
        }
        return $optionsMetaArray;
    }
    
    private function _createCategoryMetaArrayForGalleryOptions(org_tubepress_options_storage_StorageManager $storageManager, org_tubepress_api_message_MessageService $messageService)
    {
        $modeNames = org_tubepress_options_reference_OptionsReference::getValidEnumValues(org_tubepress_options_category_Gallery::MODE);
        $modesMetaArray = array();
        foreach ($modeNames as $modeName) {
            $modeMetaArray = array();
            $modeMetaArray[org_tubepress_api_template_Template::OPTIONS_PAGE_OPTIONS_TITLE] = $messageService->_("options-title-$modeName");
            $modeMetaArray[org_tubepress_api_template_Template::OPTIONS_PAGE_OPTIONS_PRO_ONLY] = "";
            $html = $this->_getHtmlForRadio($modeName, $storageManager);
            if (org_tubepress_options_reference_OptionsReference::isOptionName($modeName . 'Value')) {
                $newName = $modeName . 'Value';
                $html .= $this->_getWidgetHtml($newName, $storageManager, $messageService);
            }
            $modeMetaArray[org_tubepress_api_template_Template::OPTIONS_PAGE_OPTIONS_WIDGET] = $html;
            $modeMetaArray[org_tubepress_api_template_Template::OPTIONS_PAGE_YOUTUBE_OPTION] = org_tubepress_options_reference_OptionsReference::appliesToYouTube($modeName);
            $modeMetaArray[org_tubepress_api_template_Template::OPTIONS_PAGE_VIMEO_OPTION]   = org_tubepress_options_reference_OptionsReference::appliesToVimeo($modeName);
            $modeMetaArray[org_tubepress_api_template_Template::OPTIONS_PAGE_OPTIONS_DESC]   = $messageService->_("options-desc-$modeName");
            
            $modesMetaArray[] = $modeMetaArray;
        }
        return $modesMetaArray;            
    }
    
    private function _getWidgetHtml($optionName, org_tubepress_options_storage_StorageManager $storageManager, 
        org_tubepress_api_message_MessageService $messageService)
    {
        $type = org_tubepress_options_reference_OptionsReference::getType($optionName);
        $value = $storageManager->get($optionName);
        
        switch ($type) {
            case org_tubepress_options_Type::BOOL:
                $checked = $value ? 'CHECKED' : '';
                return "<input type=\"checkbox\" name=\"$optionName\" value=\"$optionName\" $checked />";
            case org_tubepress_options_Type::TEXT:
            case org_tubepress_options_Type::INTEGRAL:
                return "<input type=\"text\" name=\"$optionName\" size=\"20\" value=\"$value\" />";
            case org_tubepress_options_Type::COLOR:
                return "<input type=\"text\" name=\"$optionName\" size=\"6\" class=\"color\" value=\"$value\" />";
            case org_tubepress_options_Type::ORDER:
            case org_tubepress_options_Type::PLAYER:
            case org_tubepress_options_Type::TIME_FRAME:
            case org_tubepress_options_Type::SAFE_SEARCH:
            case org_tubepress_options_Type::PLAYER_IMPL:
                $validValues = org_tubepress_options_reference_OptionsReference::getValidEnumValues($type);
                $result = "<select name=\"$optionName\">";
                
                foreach ($validValues as $validValue) {
                    $validValueTitle = $messageService->_("$type-$validValue");
                    $selected = $validValue === $value ? 'SELECTED' : '';
                    $result .= "<option value=\"$validValue\" $selected>$validValueTitle</option>";
                }
                $result .= '</select>';
                return $result;    
            case org_tubepress_options_Type::THEME:
                $validValues = org_tubepress_options_reference_OptionsReference::getValidEnumValues($type);
                $result = "<select name=\"$optionName\">";
                
                foreach ($validValues as $validValue) {
                    $default = $validValue == 'default' && $value == '';
                    $selected = $validValue === $value || $default ? 'SELECTED' : '';
                    $result .= "<option value=\"$validValue\" $selected>$validValue</option>";
                }
                $result .= '</select>';
                return $result;
        }
    }
    
    private function _getHtmlForRadio($optionName, org_tubepress_options_storage_StorageManager $storageManager)
    {
        $value = $storageManager->get(org_tubepress_options_category_Gallery::MODE);
        $checked = $optionName === $value ? 'CHECKED' : '';
        return "<input type=\"radio\" name=\"mode\" id=\"$optionName\" value=\"$optionName\" $checked />";
    }
}
