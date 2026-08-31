import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Get(':key')
  getSetting(@Param('key') key: string) {
    return this.settingsService.getSetting(key);
  }

  @Post()
  updateSettings(@Body() newSettings: any) {
    return this.settingsService.updateSettings(newSettings);
  }
}
