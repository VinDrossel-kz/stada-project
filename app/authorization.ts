import {getChatGPTUser} from './chatgpt-auth';
export async function isOrganizer(){const user=await getChatGPTUser();return !!user&&user.email.toLowerCase()==='andrewyemtsev03@gmail.com'}
